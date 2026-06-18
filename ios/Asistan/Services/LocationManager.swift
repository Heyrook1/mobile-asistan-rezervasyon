import Foundation
import CoreLocation

/// Wraps CoreLocation for one-shot location requests during onboarding.
@MainActor
@Observable
final class LocationManager: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()

    var authorizationStatus: CLAuthorizationStatus = .notDetermined
    var coordinate: CLLocationCoordinate2D?
    var city: String?
    var isResolving = false
    var didFail = false

    private var continuation: CheckedContinuation<CLLocationCoordinate2D?, Never>?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        authorizationStatus = manager.authorizationStatus
    }

    /// Requests permission then resolves a single coordinate. Returns nil if denied/failed.
    func requestLocation() async -> CLLocationCoordinate2D? {
        didFail = false
        isResolving = true
        let status = manager.authorizationStatus
        if status == .notDetermined {
            manager.requestWhenInUseAuthorization()
        } else if status == .denied || status == .restricted {
            isResolving = false
            didFail = true
            return nil
        }
        return await withCheckedContinuation { (cont: CheckedContinuation<CLLocationCoordinate2D?, Never>) in
            self.continuation = cont
            self.manager.requestLocation()
        }
    }

    private func finish(_ coordinate: CLLocationCoordinate2D?) {
        isResolving = false
        continuation?.resume(returning: coordinate)
        continuation = nil
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            self.authorizationStatus = manager.authorizationStatus
            if manager.authorizationStatus == .denied || manager.authorizationStatus == .restricted {
                self.didFail = true
                self.finish(nil)
            } else if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
                if self.continuation != nil {
                    manager.requestLocation()
                }
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        Task { @MainActor in
            self.coordinate = loc.coordinate
            await self.reverseGeocode(loc)
            self.finish(loc.coordinate)
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            self.didFail = true
            self.finish(nil)
        }
    }

    private func reverseGeocode(_ location: CLLocation) async {
        let geocoder = CLGeocoder()
        if let placemark = try? await geocoder.reverseGeocodeLocation(location).first {
            city = placemark.administrativeArea ?? placemark.locality
        }
    }
}

/// KKTC (Kuzey Kıbrıs Türk Cumhuriyeti) şehir ve ilçeleri — manuel seçim için yaklaşık koordinatlar.
nonisolated struct KKTCSehir: Identifiable, Sendable {
    var id: String { name }
    let name: String
    let lat: Double
    let lng: Double

    static let all: [KKTCSehir] = [
        .init(name: "Lefkoşa", lat: 35.1856, lng: 33.3823),
        .init(name: "Gazimağusa", lat: 35.1250, lng: 33.9417),
        .init(name: "Girne", lat: 35.3395, lng: 33.3191),
        .init(name: "Güzelyurt", lat: 35.1975, lng: 32.9914),
        .init(name: "İskele", lat: 35.2858, lng: 33.8917),
        .init(name: "Lefke", lat: 35.1058, lng: 32.8492),
        .init(name: "Dipkarpaz", lat: 35.6083, lng: 34.3847),
        .init(name: "Mehmetçik", lat: 35.4139, lng: 34.0722),
        .init(name: "Yeni Erenköy", lat: 35.4333, lng: 34.0833),
        .init(name: "Değirmenlik", lat: 35.2444, lng: 33.5667),
        .init(name: "Akdoğan", lat: 35.2333, lng: 33.7667),
        .init(name: "Geçitkale", lat: 35.2667, lng: 33.7333),
        .init(name: "Tatlısu", lat: 35.3167, lng: 33.6000),
        .init(name: "Esentepe", lat: 35.3167, lng: 33.5667),
        .init(name: "Lapta", lat: 35.3500, lng: 33.1667),
        .init(name: "Alsancak", lat: 35.3500, lng: 33.2000),
        .init(name: "Çatalköy", lat: 35.3167, lng: 33.3833),
        .init(name: "Dikmen", lat: 35.2667, lng: 33.3167),
        .init(name: "Beylerbeyi", lat: 35.2500, lng: 33.4167),
        .init(name: "Vadili", lat: 35.1333, lng: 33.6500),
        .init(name: "Yeniboğaziçi", lat: 35.1333, lng: 33.9333),
    ]
}
