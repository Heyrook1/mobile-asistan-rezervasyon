package com.rork.asistanrezervasyonandroid.ui.screens

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.asistanrezervasyonandroid.data.KKTCSehir
import com.rork.asistanrezervasyonandroid.data.LocationHelper
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.LocalToast
import com.rork.asistanrezervasyonandroid.ui.components.PrimaryButton
import com.rork.asistanrezervasyonandroid.ui.components.ToastStyle
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import kotlinx.coroutines.launch

@Composable
fun LocationOnboardingScreen(auth: AuthViewModel, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val toast = LocalToast.current
    val scope = rememberCoroutineScope()

    var showManual by rememberSaveable { mutableStateOf(false) }
    var searchText by rememberSaveable { mutableStateOf("") }
    var isResolving by remember { mutableStateOf(false) }

    fun resolveDeviceLocation() {
        scope.launch {
            isResolving = true
            val resolved = LocationHelper.resolve(context)
            if (resolved != null) {
                auth.saveLocation(resolved.lat, resolved.lng, resolved.city)
            } else {
                toast.show("Konum alınamadı. Şehri elle seçebilirsin.", ToastStyle.ERROR)
                showManual = true
            }
            isResolving = false
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        if (grants.values.any { it }) {
            resolveDeviceLocation()
        } else {
            toast.show("Konum izni verilmedi. Şehri elle seçebilirsin.", ToastStyle.ERROR)
            showManual = true
        }
    }

    fun useDeviceLocation() {
        if (LocationHelper.hasPermission(context)) {
            resolveDeviceLocation()
        } else {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                )
            )
        }
    }

    Box(modifier = modifier.fillMaxSize().background(AppColors.Canvas)) {
        if (showManual) {
            ManualCitySelection(
                searchText = searchText,
                onSearchChange = { searchText = it },
                onBack = { showManual = false },
                onSelect = { city ->
                    scope.launch {
                        isResolving = true
                        auth.saveCity(city.name, city.lat, city.lng)
                        isResolving = false
                    }
                },
            )
        } else {
            PermissionPrompt(
                isLoading = isResolving,
                onUseLocation = { useDeviceLocation() },
                onManual = { showManual = true },
                onSkip = { auth.skipLocation() },
            )
        }
    }
}

@Composable
private fun PermissionPrompt(
    isLoading: Boolean,
    onUseLocation: () -> Unit,
    onManual: () -> Unit,
    onSkip: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.weight(1f))
        Box(contentAlignment = Alignment.Center) {
            Box(modifier = Modifier.size(150.dp).background(AppColors.Teal.copy(alpha = 0.12f), CircleShape))
            Box(modifier = Modifier.size(104.dp).background(AppColors.Teal.copy(alpha = 0.18f), CircleShape))
            Icon(
                Icons.Filled.LocationOn,
                contentDescription = null,
                tint = AppColors.Teal,
                modifier = Modifier.size(48.dp),
            )
        }
        Spacer(modifier = Modifier.height(28.dp))
        Text("Konumunu paylaş", fontSize = 26.sp, fontWeight = FontWeight.Black, color = AppColors.Ink)
        Text(
            "Sana en yakın klinikleri ve doktorları\ngösterebilmemiz için konumuna ihtiyacımız var.",
            fontSize = 15.sp,
            color = AppColors.InkSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 8.dp).padding(horizontal = 24.dp),
        )
        Spacer(modifier = Modifier.weight(1f))
        Column(
            modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            PrimaryButton(
                title = "Konumumu kullan",
                icon = Icons.Filled.LocationOn,
                isLoading = isLoading,
            ) { onUseLocation() }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(AppColors.Surface)
                    .pressableClickable { onManual() },
                contentAlignment = Alignment.Center,
            ) {
                Text("Şehri elle seç", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.Teal)
            }

            Text(
                "Şimdilik geç",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = AppColors.InkTertiary,
                modifier = Modifier
                    .padding(top = 4.dp)
                    .pressableClickable { onSkip() }
                    .padding(8.dp),
            )
        }
    }
}

@Composable
private fun ManualCitySelection(
    searchText: String,
    onSearchChange: (String) -> Unit,
    onBack: () -> Unit,
    onSelect: (KKTCSehir) -> Unit,
) {
    val filtered = remember(searchText) {
        if (searchText.isEmpty()) KKTCSehir.all
        else KKTCSehir.all.filter { it.name.contains(searchText, ignoreCase = true) }
    }
    Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri", tint = AppColors.Ink)
            }
            Text(
                "Şehir seç",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.Ink,
                textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f),
            )
            Spacer(modifier = Modifier.size(48.dp))
        }

        OutlinedTextField(
            value = searchText,
            onValueChange = onSearchChange,
            placeholder = { Text("Şehir ara", fontSize = 15.sp, color = AppColors.InkTertiary) },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = AppColors.InkTertiary) },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AppColors.Teal,
                unfocusedBorderColor = AppColors.Stroke,
                focusedContainerColor = AppColors.Surface,
                unfocusedContainerColor = AppColors.Surface,
            ),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
        )

        LazyColumn(
            contentPadding = androidx.compose.foundation.layout.PaddingValues(
                start = 20.dp, end = 20.dp, top = 14.dp, bottom = 30.dp
            ),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(filtered, key = { it.name }) { city ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(58.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(AppColors.Surface)
                        .pressableClickable { onSelect(city) }
                        .padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(Icons.Filled.Place, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(24.dp))
                    Text(
                        city.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = AppColors.Ink,
                        modifier = Modifier.weight(1f),
                    )
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = null,
                        tint = AppColors.InkTertiary,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
        }
    }
}
