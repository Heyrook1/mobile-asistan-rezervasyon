import SwiftUI

struct AuthFlowView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(ToastCenter.self) private var toast

    enum Mode { case login, register }
    @State private var mode: Mode = .login

    // Shared fields
    @State private var fullName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var errorText: String?
    @FocusState private var focused: Field?

    enum Field { case name, email, phone, password }

    private var canSubmit: Bool {
        if mode == .register {
            return !fullName.trimmingCharacters(in: .whitespaces).isEmpty &&
                isValidEmail(email) && password.count >= 6
        }
        return isValidEmail(email) && !password.isEmpty
    }

    var body: some View {
        ZStack(alignment: .top) {
            Theme.canvas.ignoresSafeArea()
            header
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    Spacer().frame(height: 210)
                    card
                        .padding(.horizontal, 20)
                        .padding(.bottom, 40)
                }
            }
        }
        .onChange(of: mode) { _, _ in errorText = nil }
    }

    private var header: some View {
        ZStack(alignment: .bottomLeading) {
            Theme.heroGradient
                .ignoresSafeArea(edges: .top)
                .frame(height: 250)
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Image(systemName: "stethoscope")
                        .font(.system(size: 20, weight: .bold))
                    Text("Asistan")
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                }
                .foregroundStyle(.white)
                Text("Hızlı ve güvenli\nrandevu")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(.white)
                Text("Kliniklerini keşfet, en uygun saati seç.")
                    .font(.system(size: 14))
                    .foregroundStyle(.white.opacity(0.9))
            }
            .padding(.horizontal, 28)
            .padding(.bottom, 70)
        }
        .frame(height: 250)
    }

    private var card: some View {
        VStack(spacing: 18) {
            Text(mode == .login ? "Giriş Yap" : "Kayıt Ol")
                .font(.system(size: 24, weight: .heavy))
                .foregroundStyle(Theme.ink)
                .frame(maxWidth: .infinity, alignment: .leading)

            VStack(spacing: 12) {
                if mode == .register {
                    field(icon: "person.fill", placeholder: "Ad Soyad", text: $fullName, field: .name)
                        .textContentType(.name)
                }
                field(icon: "envelope.fill", placeholder: "E-posta adresiniz", text: $email, field: .email)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                if mode == .register {
                    field(icon: "phone.fill", placeholder: "Telefon (opsiyonel)", text: $phone, field: .phone)
                        .keyboardType(.phonePad)
                }
                passwordField
            }

            if let errorText {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.circle.fill")
                    Text(errorText).font(.system(size: 13, weight: .medium))
                    Spacer()
                }
                .foregroundStyle(Theme.danger)
            }

            PrimaryButton(
                title: mode == .login ? "Giriş Yap" : "Hesap Oluştur",
                icon: "arrow.right",
                isLoading: auth.isWorking,
                enabled: canSubmit
            ) { submit() }

            HStack(spacing: 4) {
                Text(mode == .login ? "Hesabınız yok mu?" : "Zaten üye misiniz?")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.inkSecondary)
                Button(mode == .login ? "Kayıt ol" : "Giriş yap") {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
                        mode = mode == .login ? .register : .login
                    }
                }
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Theme.teal)
            }
            .padding(.top, 2)

            Text("Devam ederek KVKK ve gizlilik koşullarını kabul edersiniz.")
                .font(.system(size: 11))
                .foregroundStyle(Theme.inkTertiary)
                .multilineTextAlignment(.center)
        }
        .padding(22)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
        .shadow(color: .black.opacity(0.08), radius: 24, y: 12)
    }

    private func field(icon: String, placeholder: String, text: Binding<String>, field: Field) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(focused == field ? Theme.teal : Theme.inkTertiary)
                .frame(width: 20)
            TextField(placeholder, text: text)
                .font(.system(size: 15))
                .focused($focused, equals: field)
        }
        .padding(.horizontal, 14)
        .frame(height: 52)
        .background(Theme.canvas, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(focused == field ? Theme.teal : Color.clear, lineWidth: 1.5)
        )
    }

    private var passwordField: some View {
        HStack(spacing: 10) {
            Image(systemName: "lock.fill")
                .font(.system(size: 15))
                .foregroundStyle(focused == .password ? Theme.teal : Theme.inkTertiary)
                .frame(width: 20)
            Group {
                if showPassword {
                    TextField("Şifre", text: $password)
                } else {
                    SecureField("Şifre", text: $password)
                }
            }
            .font(.system(size: 15))
            .focused($focused, equals: .password)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            Button {
                showPassword.toggle()
            } label: {
                Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.inkTertiary)
            }
        }
        .padding(.horizontal, 14)
        .frame(height: 52)
        .background(Theme.canvas, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(focused == .password ? Theme.teal : Color.clear, lineWidth: 1.5)
        )
    }

    private func submit() {
        focused = nil
        errorText = nil
        Task {
            do {
                if mode == .login {
                    try await auth.signIn(email: email, password: password)
                } else {
                    try await auth.register(
                        fullName: fullName.trimmingCharacters(in: .whitespaces),
                        email: email,
                        phone: phone.trimmingCharacters(in: .whitespaces),
                        password: password
                    )
                    toast.show("Hesabınız oluşturuldu, hoş geldiniz!", style: .success)
                }
            } catch let error as APIError {
                errorText = error.message
            } catch {
                errorText = mode == .login
                    ? "Giriş başarısız. E-posta veya şifre hatalı."
                    : "Kayıt başarısız. Lütfen tekrar deneyin."
            }
        }
    }

    private func isValidEmail(_ value: String) -> Bool {
        let v = value.trimmingCharacters(in: .whitespaces)
        return v.contains("@") && v.contains(".") && v.count >= 5
    }
}
