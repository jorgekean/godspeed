import UIKit
import Capacitor
import StoreKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

// =============================================================================
// NATIVE APPLE STOREKIT 2 CAPACITOR PLUGIN
// Direct integration with Apple StoreKit 2 (No third-party SDKs or accounts needed)
// =============================================================================
@objc(NativeStoreKitPlugin)
public class NativeStoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeStoreKitPlugin"
    public let jsName = "NativeStoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "purchaseProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPurchases", returnType: CAPPluginReturnPromise)
    ]

    @objc func purchaseProduct(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Product ID is required")
            return
        }

        Task { @MainActor in
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product '\(productId)' not found in App Store. Ensure it is configured in App Store Connect.")
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve([
                            "success": true,
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id)
                        ])
                    case .unverified(_, let error):
                        call.reject("Transaction unverified: \(error.localizedDescription)")
                    }
                case .userCancelled:
                    call.reject("Purchase cancelled by user", "USER_CANCELLED")
                case .pending:
                    call.resolve([
                        "success": false,
                        "pending": true,
                        "message": "Purchase pending authorization (Ask to Buy)."
                    ])
                @unknown default:
                    call.reject("Unknown StoreKit response")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                try await AppStore.sync()
                var hasLifetime = false

                for await result in Transaction.currentEntitlements {
                    if case .verified(let transaction) = result {
                        if transaction.productID == "com.godspeedgrader.lifetime" {
                            hasLifetime = true
                            break
                        }
                    }
                }

                call.resolve([
                    "success": true,
                    "restored": hasLifetime
                ])
            } catch {
                call.reject("Restore failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func checkPurchases(_ call: CAPPluginCall) {
        Task { @MainActor in
            var hasLifetime = false
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result {
                    if transaction.productID == "com.godspeedgrader.lifetime" {
                        hasLifetime = true
                        break
                    }
                }
            }

            call.resolve([
                "isLifetime": hasLifetime
            ])
        }
    }
}

