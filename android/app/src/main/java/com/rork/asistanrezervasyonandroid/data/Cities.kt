package com.rork.asistanrezervasyonandroid.data

/** KKTC (Kuzey Kıbrıs Türk Cumhuriyeti) şehir ve ilçeleri — manuel seçim için yaklaşık koordinatlar. */
data class KKTCSehir(
    val name: String,
    val lat: Double,
    val lng: Double,
) {
    companion object {
        val all: List<KKTCSehir> = listOf(
            KKTCSehir("Lefkoşa", 35.1856, 33.3823),
            KKTCSehir("Gazimağusa", 35.1250, 33.9417),
            KKTCSehir("Girne", 35.3395, 33.3191),
            KKTCSehir("Güzelyurt", 35.1975, 32.9914),
            KKTCSehir("İskele", 35.2858, 33.8917),
            KKTCSehir("Lefke", 35.1058, 32.8492),
            KKTCSehir("Dipkarpaz", 35.6083, 34.3847),
            KKTCSehir("Mehmetçik", 35.4139, 34.0722),
            KKTCSehir("Yeni Erenköy", 35.4333, 34.0833),
            KKTCSehir("Değirmenlik", 35.2444, 33.5667),
            KKTCSehir("Akdoğan", 35.2333, 33.7667),
            KKTCSehir("Geçitkale", 35.2667, 33.7333),
            KKTCSehir("Tatlısu", 35.3167, 33.6000),
            KKTCSehir("Esentepe", 35.3167, 33.5667),
            KKTCSehir("Lapta", 35.3500, 33.1667),
            KKTCSehir("Alsancak", 35.3500, 33.2000),
            KKTCSehir("Çatalköy", 35.3167, 33.3833),
            KKTCSehir("Dikmen", 35.2667, 33.3167),
            KKTCSehir("Beylerbeyi", 35.2500, 33.4167),
            KKTCSehir("Vadili", 35.1333, 33.6500),
            KKTCSehir("Yeniboğaziçi", 35.1333, 33.9333),
        )
    }
}
