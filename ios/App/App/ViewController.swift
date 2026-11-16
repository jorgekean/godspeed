import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        // Register the NativeStoreKitPlugin instance directly with the Capacitor bridge
        bridge?.registerPluginInstance(NativeStoreKitPlugin())
    }

    override open func viewDidLoad() {
        super.viewDidLoad()
        bridge?.registerPluginInstance(NativeStoreKitPlugin())
    }
}
