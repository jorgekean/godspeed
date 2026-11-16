import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        // Register the NativeStoreKitPlugin directly with the Capacitor bridge
        bridge?.registerPluginType(NativeStoreKitPlugin.self)
    }
}
