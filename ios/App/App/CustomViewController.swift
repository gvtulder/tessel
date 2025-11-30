import UIKit
import Capacitor

class CustomViewController: CAPBridgeViewController {
  override func capacitorDidLoad() {
    bridge?.registerPluginInstance(SwipeBackPlugin())
  }
}
