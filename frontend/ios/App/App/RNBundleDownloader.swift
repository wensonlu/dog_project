import Foundation

enum RNBundleDownloaderError: LocalizedError {
    case invalidManifestURL
    case unsafeURL(URL)
    case invalidManifest
    case checksumMismatch(expected: String, actual: String)

    var errorDescription: String? {
        switch self {
        case .invalidManifestURL:
            return "Invalid RN bundle manifest URL."
        case .unsafeURL(let url):
            return "Refusing non-local RN bundle URL: \(url.absoluteString)"
        case .invalidManifest:
            return "Invalid RN bundle manifest."
        case .checksumMismatch(let expected, let actual):
            return "RN bundle checksum mismatch. Expected \(expected), got \(actual)."
        }
    }
}

final class RNBundleDownloader {
    private let store: RNBundleStore
    private let session: URLSession

    init(store: RNBundleStore = .shared, session: URLSession = .shared) {
        self.store = store
        self.session = session
    }

    func installBundle(from manifestURL: URL, completion: @escaping (Result<RNBundleManifest, Error>) -> Void) {
        guard isSafeLocalURL(manifestURL) else {
            completion(.failure(RNBundleDownloaderError.unsafeURL(manifestURL)))
            return
        }

        session.dataTask(with: manifestURL) { [store, session] manifestData, _, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let manifestData = manifestData,
                  let manifest = try? JSONDecoder().decode(RNBundleManifest.self, from: manifestData),
                  manifest.type == "dogproject-rn-bundle",
                  manifest.platform == "ios" else {
                completion(.failure(RNBundleDownloaderError.invalidManifest))
                return
            }

            guard self.isSafeLocalURL(manifest.bundleUrl) else {
                completion(.failure(RNBundleDownloaderError.unsafeURL(manifest.bundleUrl)))
                return
            }

            session.dataTask(with: manifest.bundleUrl) { bundleData, _, error in
                if let error = error {
                    completion(.failure(error))
                    return
                }

                guard let bundleData = bundleData else {
                    completion(.failure(RNBundleDownloaderError.invalidManifest))
                    return
                }

                let actual = store.sha256Hex(for: bundleData)
                guard actual.lowercased() == manifest.sha256.lowercased() else {
                    completion(.failure(RNBundleDownloaderError.checksumMismatch(expected: manifest.sha256, actual: actual)))
                    return
                }

                do {
                    try store.save(bundleData: bundleData, manifestData: manifestData)
                    completion(.success(manifest))
                } catch {
                    completion(.failure(error))
                }
            }.resume()
        }.resume()
    }

    private func isSafeLocalURL(_ url: URL) -> Bool {
        guard url.scheme == "http", let host = url.host else {
            return false
        }
        return host == "localhost"
            || host == "127.0.0.1"
            || host.hasPrefix("192.168.")
            || host.hasPrefix("10.")
            || host.range(of: #"^172\.(1[6-9]|2[0-9]|3[0-1])\."#, options: .regularExpression) != nil
    }
}
