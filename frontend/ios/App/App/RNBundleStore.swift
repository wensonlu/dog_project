import Foundation
import CryptoKit

final class RNBundleStore {
    static let shared = RNBundleStore()

    private let fileManager = FileManager.default
    private let bundleFileName = "main.jsbundle"
    private let manifestFileName = "rn-bundle-manifest.json"

    private init() {}

    var bundledBundleURL: URL? {
        Bundle.main.url(forResource: "main", withExtension: "jsbundle", subdirectory: "rn_bundle")
    }

    var cachedDirectoryURL: URL {
        let baseURL = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return baseURL.appendingPathComponent("rn_bundle", isDirectory: true)
    }

    var cachedBundleURL: URL {
        cachedDirectoryURL.appendingPathComponent(bundleFileName)
    }

    var cachedManifestURL: URL {
        cachedDirectoryURL.appendingPathComponent(manifestFileName)
    }

    func activeBundleURL() -> URL? {
        if fileManager.fileExists(atPath: cachedBundleURL.path) {
            return cachedBundleURL
        }
        return bundledBundleURL
    }

    func save(bundleData: Data, manifestData: Data) throws {
        try fileManager.createDirectory(at: cachedDirectoryURL, withIntermediateDirectories: true)
        try bundleData.write(to: cachedBundleURL, options: .atomic)
        try manifestData.write(to: cachedManifestURL, options: .atomic)
    }

    func sha256Hex(for data: Data) -> String {
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
