import Foundation

struct RNBundleManifest: Decodable {
    let type: String
    let version: Int
    let platform: String
    let bundleUrl: URL
    let sourceMapUrl: URL?
    let manifestUrl: URL?
    let sha256: String
    let route: String?
    let debugParams: [String: String]?

    var launchUrl: String {
        guard let route = route, !route.isEmpty else {
            return "dogproject://rn-demo"
        }
        return "dogproject://\(route)"
    }
}
