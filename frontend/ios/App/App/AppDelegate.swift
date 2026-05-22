import UIKit
import Capacitor
import React

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var rnBridge: RCTBridge?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if handleRNRoute(url: url) {
            return true
        }
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    private func handleRNRoute(url: URL) -> Bool {
        guard url.scheme == "dogproject" else {
            return false
        }
        let route = url.host ?? ""
        guard route == "pet" || route == "forum" else {
            return false
        }
        // Return from openURL as soon as possible; initializing RN bridge can be slow
        // and would otherwise make iOS treat this deep link as timed out.
        DispatchQueue.main.async { [weak self] in
            self?.presentReactNativeScreen(for: url)
        }
        return true
    }

    private func presentReactNativeScreen(for url: URL) {
        if rnBridge == nil {
            rnBridge = RCTBridge(delegate: self, launchOptions: nil)
        }
        guard let bridge = rnBridge else { return }

        let rootView = RCTRootView(
            bridge: bridge,
            moduleName: "main",
            initialProperties: ["launchUrl": url.absoluteString]
        )
        rootView.backgroundColor = UIColor.systemBackground

        let vc = UIViewController()
        vc.view = rootView
        vc.modalPresentationStyle = .fullScreen

        guard let root = window?.rootViewController ?? UIApplication.shared.windows.first?.rootViewController else {
            return
        }
        let presentingVC = root.presentedViewController ?? root
        presentingVC.present(vc, animated: true)
    }

}

extension AppDelegate: RCTBridgeDelegate {
    func sourceURL(for bridge: RCTBridge!) -> URL! {
#if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle", subdirectory: "rn_bundle")
#endif
    }
}
