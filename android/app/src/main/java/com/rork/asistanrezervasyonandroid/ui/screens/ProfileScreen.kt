package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Tag
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.KKTCSehir
import com.rork.asistanrezervasyonandroid.data.LocationHelper
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.LocalToast
import com.rork.asistanrezervasyonandroid.ui.components.PrimaryButton
import com.rork.asistanrezervasyonandroid.ui.components.ToastStyle
import com.rork.asistanrezervasyonandroid.ui.components.asistanCard
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(auth: AuthViewModel, modifier: Modifier = Modifier) {
    val toast = LocalToast.current
    val user by auth.clientUser.collectAsStateWithLifecycle()

    var showEdit by remember { mutableStateOf(false) }
    var showLocation by remember { mutableStateOf(false) }
    var showSignOut by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .padding(horizontal = 18.dp)
            .padding(top = 8.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        // Profile header
        Column(
            modifier = Modifier.fillMaxWidth().asistanCard(padding = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                modifier = Modifier.size(84.dp).clip(CircleShape).background(AppColors.BrandGradient),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    (user?.fullName?.take(1) ?: "K").uppercase(),
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    user?.fullName ?: "Kullanıcı",
                    fontSize = 21.sp,
                    fontWeight = FontWeight.Black,
                    color = AppColors.Ink,
                )
                user?.email?.let { email ->
                    Text(email, fontSize = 14.sp, color = AppColors.InkSecondary)
                }
            }
            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(AppColors.Teal.copy(alpha = 0.1f))
                    .pressableClickable { showEdit = true }
                    .padding(horizontal = 18.dp, vertical = 9.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Icon(Icons.Filled.Edit, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(15.dp))
                Text("Profili düzenle", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AppColors.Teal)
            }
        }

        // Account card
        ProfileCard(title = "Hesap Bilgileri", icon = Icons.Filled.Person) {
            InfoRow(Icons.Filled.Person, "Ad Soyad", user?.fullName ?: "-")
            RowDivider()
            InfoRow(Icons.Filled.Email, "E-posta", user?.email ?: "-")
            RowDivider()
            InfoRow(Icons.Filled.Phone, "Telefon", user?.phone ?: "Eklenmedi")
        }

        // Location card
        Box(modifier = Modifier.pressableClickable { showLocation = true }) {
            ProfileCard(title = "Konum", icon = Icons.Filled.LocationOn) {
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            user?.city ?: "Konum seçilmedi",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = AppColors.Ink,
                        )
                        Text(
                            if (user?.hasLocation == true) "Yakındaki klinikler gösteriliyor" else "Şehir seçerek klinik bulun",
                            fontSize = 12.5.sp,
                            color = AppColors.InkSecondary,
                        )
                    }
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = null,
                        tint = AppColors.InkTertiary,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
        }

        // About card
        ProfileCard(title = "Hakkında", icon = Icons.Filled.Info) {
            LinkRow(Icons.Filled.Shield, "Gizlilik ve KVKK")
            RowDivider()
            LinkRow(Icons.Filled.Description, "Kullanım koşulları")
            RowDivider()
            InfoRow(Icons.Filled.Tag, "Sürüm", "1.0.0")
        }

        // Sign out
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(AppColors.Surface)
                .border(1.dp, AppColors.Danger.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                .pressableClickable { showSignOut = true },
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null, tint = AppColors.Danger, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.size(8.dp))
            Text("Çıkış Yap", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AppColors.Danger)
        }

        Spacer(modifier = Modifier.height(90.dp))
    }

    if (showSignOut) {
        AlertDialog(
            onDismissRequest = { showSignOut = false },
            title = { Text("Çıkış yap", fontWeight = FontWeight.Bold) },
            text = { Text("Hesabınızdan çıkış yapmak istediğinize emin misiniz?") },
            confirmButton = {
                TextButton(onClick = {
                    showSignOut = false
                    auth.signOut()
                }) {
                    Text("Çıkış yap", color = AppColors.Danger, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showSignOut = false }) {
                    Text("Vazgeç", color = AppColors.InkSecondary)
                }
            },
            containerColor = AppColors.Surface,
        )
    }

    if (showEdit) {
        EditProfileSheet(
            auth = auth,
            onDismiss = { showEdit = false },
            onSaved = {
                showEdit = false
                toast.show("Profiliniz güncellendi.", ToastStyle.SUCCESS)
            },
        )
    }

    if (showLocation) {
        EditLocationSheet(
            auth = auth,
            onDismiss = { showLocation = false },
            onSaved = {
                showLocation = false
                toast.show("Konumunuz güncellendi.", ToastStyle.SUCCESS)
            },
        )
    }
}

@Composable
private fun ProfileCard(title: String, icon: ImageVector, content: @Composable () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().asistanCard(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
            Icon(icon, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(15.dp))
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Black, color = AppColors.InkSecondary)
        }
        content()
    }
}

@Composable
private fun RowDivider() {
    HorizontalDivider(color = AppColors.Stroke, modifier = Modifier.padding(start = 36.dp))
}

@Composable
private fun InfoRow(icon: ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(icon, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(17.dp))
        Text(label, fontSize = 14.sp, color = AppColors.InkSecondary)
        Spacer(modifier = Modifier.weight(1f))
        Text(
            value,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = AppColors.Ink,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun LinkRow(icon: ImageVector, label: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(icon, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(17.dp))
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = AppColors.Ink)
        Spacer(modifier = Modifier.weight(1f))
        Icon(
            Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = AppColors.InkTertiary,
            modifier = Modifier.size(16.dp),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditProfileSheet(
    auth: AuthViewModel,
    onDismiss: () -> Unit,
    onSaved: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()
    val user by auth.clientUser.collectAsStateWithLifecycle()

    var fullName by remember { mutableStateOf(user?.fullName ?: "") }
    var phone by remember { mutableStateOf(user?.phone ?: "") }
    var isSaving by remember { mutableStateOf(false) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = AppColors.Canvas,
    ) {
        Column(modifier = Modifier.navigationBarsPadding().padding(horizontal = 20.dp)) {
            Text(
                "Profili Düzenle",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.Ink,
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            )
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                SheetFieldGroup("Ad Soyad", Icons.Filled.Person, fullName, "Ad Soyad") { fullName = it }
                SheetFieldGroup(
                    "Telefon", Icons.Filled.Phone, phone, "Telefon",
                    keyboardType = KeyboardType.Phone,
                ) { phone = it }
            }
            PrimaryButton(
                title = "Kaydet",
                isLoading = isSaving,
                enabled = fullName.trim().isNotEmpty(),
                modifier = Modifier.padding(vertical = 20.dp),
            ) {
                isSaving = true
                scope.launch {
                    val updated = runCatching {
                        ApiService.updateProfile(fullName = fullName.trim(), phone = phone.trim())
                    }.getOrNull()
                    auth.updateClientUser(updated)
                    isSaving = false
                    onSaved()
                }
            }
        }
    }
}

@Composable
private fun SheetFieldGroup(
    title: String,
    icon: ImageVector,
    value: String,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    onValueChange: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColors.InkSecondary)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, fontSize = 15.sp, color = AppColors.InkTertiary) },
            leadingIcon = { Icon(icon, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(20.dp)) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditLocationSheet(
    auth: AuthViewModel,
    onDismiss: () -> Unit,
    onSaved: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val user by auth.clientUser.collectAsStateWithLifecycle()
    val toast = LocalToast.current

    var searchText by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }

    val filtered = remember(searchText) {
        if (searchText.isEmpty()) KKTCSehir.all
        else KKTCSehir.all.filter { it.name.contains(searchText, ignoreCase = true) }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = AppColors.Canvas,
    ) {
        Column(modifier = Modifier.navigationBarsPadding().padding(horizontal = 20.dp)) {
            Text(
                "Konum",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.Ink,
                modifier = Modifier.fillMaxWidth().padding(bottom = 14.dp),
            )

            // Use current location
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(AppColors.Teal.copy(alpha = 0.08f))
                    .pressableClickable {
                        if (LocationHelper.hasPermission(context)) {
                            scope.launch {
                                isSaving = true
                                val resolved = LocationHelper.resolve(context)
                                if (resolved != null) {
                                    auth.saveLocation(resolved.lat, resolved.lng, resolved.city)
                                    isSaving = false
                                    onSaved()
                                } else {
                                    isSaving = false
                                    toast.show("Konum alınamadı. Şehri elle seçebilirsin.", ToastStyle.ERROR)
                                }
                            }
                        } else {
                            toast.show("Konum izni yok. Şehri elle seçebilirsin.", ToastStyle.ERROR)
                        }
                    }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (isSaving) {
                    CircularProgressIndicator(color = AppColors.Teal, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Filled.LocationOn, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(20.dp))
                }
                Text("Mevcut konumumu kullan", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = AppColors.Teal)
            }

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = searchText,
                onValueChange = { searchText = it },
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
                modifier = Modifier.fillMaxWidth(),
            )

            LazyColumn(
                modifier = Modifier.weight(1f, fill = false),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 14.dp, bottom = 20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(filtered, key = { it.name }) { city ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(AppColors.Surface)
                            .border(1.dp, AppColors.Stroke, RoundedCornerShape(12.dp))
                            .pressableClickable {
                                scope.launch {
                                    isSaving = true
                                    auth.saveCity(city.name, city.lat, city.lng)
                                    isSaving = false
                                    onSaved()
                                }
                            }
                            .padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Icon(Icons.Filled.Place, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(22.dp))
                        Text(
                            city.name,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = AppColors.Ink,
                            modifier = Modifier.weight(1f),
                        )
                        if (user?.city == city.name) {
                            Icon(Icons.Filled.CheckCircle, contentDescription = "Seçili", tint = AppColors.Teal, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    }
}
