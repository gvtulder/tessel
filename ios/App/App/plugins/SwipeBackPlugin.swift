import Foundation
import Capacitor

@objc(SwipeBackPlugin)
public class SwipeBackPlugin: CAPPlugin, CAPBridgedPlugin {
  public var pluginMethods: [CAPPluginMethod] = []
  public let identifier = "SwipeBackPlugin"
  public let jsName = "SwipeBack"
  override public func load() {
    bridge?.webView?.allowsBackForwardNavigationGestures = true;
  }
}
