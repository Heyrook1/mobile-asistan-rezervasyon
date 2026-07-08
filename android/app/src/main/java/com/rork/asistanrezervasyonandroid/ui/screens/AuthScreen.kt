package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.LocalToast
import com.rork.asistanrezervasyonandroid.ui.components.PrimaryButton
import com.rork.asistanrezervasyonandroid.ui.components.ToastStyle
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.runCatchingApi
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import kotlinx.coroutines.launch

private enum class AuthMode { LOGIN, REGISTER }

@Composable
fun AuthScreen(auth: AuthViewModel, modifier: Modifier = Modifier) {
    val toast = LocalToast.current
    val scope = rememberCoroutineScope()

    var mode by rememberSaveable { mutableStateOf(AuthMode.LOGIN) }
    var fullName by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var showPassword by rememberSaveable { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    val isWorking by auth.isWorking.collectAsStateWithLifecycle()

    fun isValidEmail(value: String): Boolean {
        val v = value.trim()
        return v.contains("@") && v.contains(".") && v.length >= 5
    }

    val canSubmit = if (mode == AuthMode.REGISTER) {
        fullName.trim().isNotEmpty() && isValidEmail(email) && password.length >= 6
    } else {
        isValidEmail(email) && password.isNotEmpty()
    }

    fun submit() {
        errorText = null
        scope.launch {
            runCatchingApi(
                onError = { errorText = it },
                fallback = if (mode == AuthMode.LOGIN) {
                    "Giriş başarısız. E-posta veya şifre hatalı."
                } else {
                    "Kayıt başarısız. Lütfen tekrar deneyin."
                },
            ) {
                if (mode == AuthMode.LOGIN) {
                    auth.signIn(email, password)
                } else {
                    auth.register(fullName.trim(), email, phone.trim(), password)
                    toast.show("Hesabınız oluşturuldu, hoş geldiniz!", ToastStyle.SUCCESS)
                }
            }
        }
    }

    Box(modifier = modifier.fillMaxSize().background(AppColors.Canvas)) {
        // Hero header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
                .background(AppColors.HeroGradient),
        ) {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(horizontal = 28.dp)
                    .padding(bottom = 70.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Filled.MonitorHeart, contentDescription = null, tint = Color.White, modifier = Modifier.size(24.dp))
                    Text("Asistan", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
                }
                Text(
                    "Hızlı ve güvenli\nrandevu",
                    fontSize = 30.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    lineHeight = 36.sp,
                )
                Text(
                    "Kliniklerini keşfet, en uygun saati seç.",
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.9f),
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .statusBarsPadding(),
        ) {
            Spacer(modifier = Modifier.height(210.dp))
            // Card
            Column(
                modifier = Modifier
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 40.dp)
                    .clip(RoundedCornerShape(26.dp))
                    .background(AppColors.Surface)
                    .padding(22.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                Text(
                    if (mode == AuthMode.LOGIN) "Giriş Yap" else "Kayıt Ol",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    color = AppColors.Ink,
                )

                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (mode == AuthMode.REGISTER) {
                        AuthField(
                            value = fullName,
                            onValueChange = { fullName = it },
                            placeholder = "Ad Soyad",
                            icon = Icons.Filled.Person,
                        )
                    }
                    AuthField(
                        value = email,
                        onValueChange = { email = it },
                        placeholder = "E-posta adresiniz",
                        icon = Icons.Filled.Email,
                        keyboardType = KeyboardType.Email,
                    )
                    if (mode == AuthMode.REGISTER) {
                        AuthField(
                            value = phone,
                            onValueChange = { phone = it },
                            placeholder = "Telefon (opsiyonel)",
                            icon = Icons.Filled.Phone,
                            keyboardType = KeyboardType.Phone,
                        )
                    }
                    AuthField(
                        value = password,
                        onValueChange = { password = it },
                        placeholder = "Şifre",
                        icon = Icons.Filled.Lock,
                        keyboardType = KeyboardType.Password,
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        trailing = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    if (showPassword) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                                    contentDescription = if (showPassword) "Şifreyi gizle" else "Şifreyi göster",
                                    tint = AppColors.InkTertiary,
                                    modifier = Modifier.size(20.dp),
                                )
                            }
                        },
                    )
                }

                errorText?.let { err ->
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Filled.Error, contentDescription = null, tint = AppColors.Danger, modifier = Modifier.size(16.dp))
                        Text(err, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = AppColors.Danger)
                    }
                }

                PrimaryButton(
                    title = if (mode == AuthMode.LOGIN) "Giriş Yap" else "Hesap Oluştur",
                    icon = Icons.AutoMirrored.Filled.ArrowForward,
                    isLoading = isWorking,
                    enabled = canSubmit,
                ) { submit() }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        if (mode == AuthMode.LOGIN) "Hesabınız yok mu?" else "Zaten üye misiniz?",
                        fontSize = 14.sp,
                        color = AppColors.InkSecondary,
                    )
                    Text(
                        if (mode == AuthMode.LOGIN) " Kayıt ol" else " Giriş yap",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.Teal,
                        modifier = Modifier.pressableClickable {
                            errorText = null
                            mode = if (mode == AuthMode.LOGIN) AuthMode.REGISTER else AuthMode.LOGIN
                        },
                    )
                }

                Text(
                    "Devam ederek KVKK ve gizlilik koşullarını kabul edersiniz.",
                    fontSize = 11.sp,
                    color = AppColors.InkTertiary,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun AuthField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    icon: ImageVector,
    keyboardType: KeyboardType = KeyboardType.Text,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    trailing: (@Composable () -> Unit)? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, fontSize = 15.sp, color = AppColors.InkTertiary) },
        leadingIcon = { Icon(icon, contentDescription = null, tint = AppColors.InkTertiary, modifier = Modifier.size(20.dp)) },
        trailingIcon = trailing,
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        visualTransformation = visualTransformation,
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = AppColors.Teal,
            unfocusedBorderColor = Color.Transparent,
            focusedContainerColor = AppColors.Canvas,
            unfocusedContainerColor = AppColors.Canvas,
            focusedLeadingIconColor = AppColors.Teal,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
}

