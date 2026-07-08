package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Sell
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.asistanrezervasyonandroid.data.SearchFilters
import com.rork.asistanrezervasyonandroid.ui.components.PrimaryButton
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterSheet(
    initial: SearchFilters,
    onDismiss: () -> Unit,
    onApply: (SearchFilters) -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    var specialty by remember { mutableStateOf(initial.specialty ?: "") }
    var service by remember { mutableStateOf(initial.service ?: "") }
    var clinicName by remember { mutableStateOf(initial.clinicName ?: "") }
    var doctorName by remember { mutableStateOf(initial.doctorName ?: "") }
    var availableToday by remember { mutableStateOf(initial.availableToday ?: false) }
    var minRating by remember { mutableDoubleStateOf(initial.minRating ?: 0.0) }
    var distanceEnabled by remember { mutableStateOf(initial.maxDistanceKm != null) }
    var maxDistance by remember { mutableDoubleStateOf(initial.maxDistanceKm ?: 50.0) }
    var priceEnabled by remember { mutableStateOf(initial.maxPrice != null) }
    var maxPrice by remember { mutableDoubleStateOf(initial.maxPrice ?: 2000.0) }

    fun reset() {
        specialty = ""; service = ""; clinicName = ""; doctorName = ""
        availableToday = false; minRating = 0.0
        distanceEnabled = false; maxDistance = 50.0
        priceEnabled = false; maxPrice = 2000.0
    }

    fun apply() {
        onApply(
            SearchFilters(
                specialty = specialty.trim().ifEmpty { null },
                service = service.trim().ifEmpty { null },
                clinicName = clinicName.trim().ifEmpty { null },
                doctorName = doctorName.trim().ifEmpty { null },
                availableToday = if (availableToday) true else null,
                minRating = if (minRating > 0) minRating else null,
                maxDistanceKm = if (distanceEnabled) maxDistance else null,
                maxPrice = if (priceEnabled) maxPrice else null,
            )
        )
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = AppColors.Canvas,
    ) {
        Column(modifier = Modifier.navigationBarsPadding()) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "Sıfırla",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AppColors.Danger,
                    modifier = Modifier.pressableClickable { reset() }.padding(4.dp),
                )
                Text(
                    "Filtrele",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.Ink,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
                Spacer(modifier = Modifier.width(52.dp))
            }

            Column(
                modifier = Modifier
                    .weight(1f, fill = false)
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp),
            ) {
                // Available today toggle
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    FilterLabel("Bugün müsait", Icons.Filled.Bolt)
                    Spacer(modifier = Modifier.weight(1f))
                    Switch(
                        checked = availableToday,
                        onCheckedChange = { availableToday = it },
                        colors = SwitchDefaults.colors(checkedTrackColor = AppColors.Teal),
                    )
                }

                FilterTextGroup("Uzmanlık", Icons.Filled.MedicalServices, specialty, "Örn. Diş Hekimi") { specialty = it }
                FilterTextGroup("Hizmet", Icons.Filled.FavoriteBorder, service, "Örn. Dolgu") { service = it }
                FilterTextGroup("Klinik adı", Icons.Filled.MedicalServices, clinicName, "Klinik ara") { clinicName = it }
                FilterTextGroup("Doktor adı", Icons.Filled.Person, doctorName, "Doktor ara") { doctorName = it }

                // Min rating slider
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        FilterLabel("En düşük puan", Icons.Filled.Star)
                        Spacer(modifier = Modifier.weight(1f))
                        Text(
                            if (minRating == 0.0) "Tümü" else String.format(Locale.US, "%.1f+", minRating),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = AppColors.Teal,
                        )
                    }
                    Slider(
                        value = minRating.toFloat(),
                        onValueChange = { minRating = (Math.round(it * 2) / 2.0) },
                        valueRange = 0f..5f,
                        colors = SliderDefaults.colors(thumbColor = AppColors.Teal, activeTrackColor = AppColors.Teal),
                    )
                }

                // Distance limit
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        FilterLabel("Mesafe sınırı", Icons.Filled.LocationOn)
                        Spacer(modifier = Modifier.weight(1f))
                        Switch(
                            checked = distanceEnabled,
                            onCheckedChange = { distanceEnabled = it },
                            colors = SwitchDefaults.colors(checkedTrackColor = AppColors.Teal),
                        )
                    }
                    if (distanceEnabled) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Slider(
                                value = maxDistance.toFloat(),
                                onValueChange = { maxDistance = it.toInt().toDouble() },
                                valueRange = 1f..100f,
                                colors = SliderDefaults.colors(thumbColor = AppColors.Teal, activeTrackColor = AppColors.Teal),
                                modifier = Modifier.weight(1f),
                            )
                            Text(
                                "${maxDistance.toInt()} km",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = AppColors.Teal,
                                textAlign = TextAlign.End,
                                modifier = Modifier.width(60.dp),
                            )
                        }
                    }
                }

                // Max price
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        FilterLabel("En yüksek fiyat", Icons.Filled.Sell)
                        Spacer(modifier = Modifier.weight(1f))
                        Switch(
                            checked = priceEnabled,
                            onCheckedChange = { priceEnabled = it },
                            colors = SwitchDefaults.colors(checkedTrackColor = AppColors.Teal),
                        )
                    }
                    if (priceEnabled) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Slider(
                                value = maxPrice.toFloat(),
                                onValueChange = { maxPrice = (Math.round(it / 50) * 50).toDouble() },
                                valueRange = 100f..5000f,
                                colors = SliderDefaults.colors(thumbColor = AppColors.Teal, activeTrackColor = AppColors.Teal),
                                modifier = Modifier.weight(1f),
                            )
                            Text(
                                "₺${maxPrice.toInt()}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = AppColors.Teal,
                                textAlign = TextAlign.End,
                                modifier = Modifier.width(70.dp),
                            )
                        }
                    }
                }
            }

            PrimaryButton(
                title = "Sonuçları göster",
                icon = Icons.Filled.Check,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
            ) { apply() }
        }
    }
}

@Composable
private fun FilterLabel(title: String, icon: ImageVector) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Icon(icon, contentDescription = null, tint = AppColors.Ink, modifier = Modifier.size(18.dp))
        Text(title, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = AppColors.Ink)
    }
}

@Composable
private fun FilterTextGroup(
    title: String,
    icon: ImageVector,
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        FilterLabel(title, icon)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, fontSize = 15.sp, color = AppColors.InkTertiary) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AppColors.Teal,
                unfocusedBorderColor = AppColors.Stroke,
                focusedContainerColor = AppColors.Surface,
                unfocusedContainerColor = AppColors.Surface,
            ),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
