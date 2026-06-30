import Foundation
import React
import UIKit

final class RNHostManager: NSObject, RCTBridgeDelegate {
    static let shared = RNHostManager()

    private let store = RNBundleStore.shared
    private let downloader = RNBundleDownloader()
    private var bridge: RCTBridge?
    private weak var presentingViewController: UIViewController?

    private override init() {
        super.init()
    }

    func handle(url: URL, from rootViewController: UIViewController?) -> Bool {
        guard url.scheme == "dogproject" else {
            return false
        }

        switch routeName(for: url) {
        case "close":
            presentingViewController?.dismiss(animated: true)
            presentingViewController = nil
            return true
        case "web":
            presentingViewController?.dismiss(animated: true)
            presentingViewController = nil
            return false
        case "rn-scan-bundle":
            presentScanner(from: rootViewController)
            return true
        case "rn-bundle":
            installBundle(from: url, rootViewController: rootViewController)
            return true
        case "content", "stories", "story", "forum", "pet", "rn-demo":
            presentRN(url: url.absoluteString, from: rootViewController, bundleSource: currentBundleSource())
            return true
        default:
            return false
        }
    }

    func sourceURL(for bridge: RCTBridge) -> URL? {
        guard let url = store.activeBundleURL() else {
            fatalError("RN bundle not found. Generate frontend/ios/App/App/rn_bundle/main.jsbundle first.")
        }
        return url
    }

    private func routeName(for url: URL) -> String {
        if let host = url.host, !host.isEmpty {
            return host
        }
        return url.pathComponents.dropFirst().first ?? ""
    }

    private func presentScanner(from rootViewController: UIViewController?) {
        let scanner = RNBundleScannerViewController()
        scanner.modalPresentationStyle = .fullScreen
        scanner.onCodeScanned = { [weak self] code in
            guard let self = self, let scannedURL = URL(string: code) else {
                return
            }
            _ = self.handle(url: scannedURL, from: rootViewController)
        }
        topViewController(from: rootViewController)?.present(scanner, animated: true)
    }

    private func installBundle(from url: URL, rootViewController: UIViewController?) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let rawManifestURL = components.queryItems?.first(where: { $0.name == "manifest" })?.value,
              let manifestURL = URL(string: rawManifestURL) else {
            showAlert(title: "RN Bundle", message: "Manifest 地址无效", from: rootViewController)
            return
        }

        downloader.installBundle(from: manifestURL) { [weak self] result in
            DispatchQueue.main.async {
                guard let self = self else {
                    return
                }
                switch result {
                case .success(let manifest):
                    self.bridge = nil
                    self.presentRN(
                        url: manifest.launchUrl,
                        from: rootViewController,
                        bundleSource: "downloaded",
                        debugParams: manifest.debugParams ?? [:]
                    )
                case .failure(let error):
                    self.showAlert(title: "RN Bundle 加载失败", message: error.localizedDescription, from: rootViewController)
                }
            }
        }
    }

    private func presentRN(
        url: String,
        from rootViewController: UIViewController?,
        bundleSource: String,
        debugParams: [String: String] = [:]
    ) {
        let bridge: RCTBridge
        if let existingBridge = self.bridge {
            bridge = existingBridge
        } else {
            guard let newBridge = RCTBridge(delegate: self, launchOptions: nil) else {
                showAlert(title: "RN 启动失败", message: "无法初始化 RN Bridge", from: rootViewController)
                return
            }
            bridge = newBridge
            self.bridge = newBridge
        }

        let rootView = RCTRootView(
            bridge: bridge,
            moduleName: "main",
            initialProperties: [
                "launchUrl": url,
                "bundleSource": bundleSource,
                "debugParams": debugParams,
            ]
        )
        rootView.backgroundColor = UIColor(red: 1.0, green: 0.98, blue: 0.96, alpha: 1.0)

        let viewController = UIViewController()
        viewController.view = rootView
        viewController.modalPresentationStyle = .fullScreen

        let presenter = topViewController(from: rootViewController)
        if let current = presentingViewController {
            current.dismiss(animated: false) {
                presenter?.present(viewController, animated: true)
            }
        } else {
            presenter?.present(viewController, animated: true)
        }
        presentingViewController = viewController
    }

    private func currentBundleSource() -> String {
        if FileManager.default.fileExists(atPath: store.cachedBundleURL.path) {
            return "downloaded"
        }
        return "bundled"
    }

    private func topViewController(from rootViewController: UIViewController?) -> UIViewController? {
        var current = rootViewController
        while let presented = current?.presentedViewController {
            current = presented
        }
        return current
    }

    private func showAlert(title: String, message: String, from rootViewController: UIViewController?) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "确定", style: .default))
        topViewController(from: rootViewController)?.present(alert, animated: true)
    }
}
