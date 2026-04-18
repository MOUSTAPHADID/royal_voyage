# Royal Voyage - Deployment Guide

## نشر التطبيق على App Store و Google Play

### المتطلبات الأساسية

1. **حسابات Developer**:
   - Apple Developer Account ($99/سنة)
   - Google Play Developer Account ($25 لمرة واحدة)

2. **الشهادات والمفاتيح**:
   - iOS: Provisioning Profiles و Certificates
   - Android: Keystore file

3. **البيانات المطلوبة**:
   - وصف التطبيق
   - لقطات الشاشة (5-8 لقطات لكل منصة)
   - أيقونة التطبيق (1024x1024)
   - سياسة الخصوصية
   - شروط الخدمة

---

## خطوات النشر على App Store (iOS)

### 1. إعداد الشهادات

```bash
# إنشاء Certificate Signing Request (CSR)
# من Keychain Access على Mac

# ثم تحميلها على Apple Developer Portal
# وتحميل الشهادات والـ Provisioning Profiles
```

### 2. إعداد ملف app.config.ts

```typescript
// تأكد من البيانات التالية:
const config: ExpoConfig = {
  name: "Royal Voyage",
  slug: "royal-voyage",
  version: "1.0.0",
  ios: {
    bundleIdentifier: "com.royalvoyage.app",
    buildNumber: "1",
  },
};
```

### 3. بناء التطبيق

```bash
# استخدام Expo EAS Build
eas build --platform ios --auto-submit

# أو بناء محلي
eas build --platform ios
```

### 4. رفع على App Store Connect

```bash
# استخدام Transporter
# أو رفع مباشرة من Xcode
```

### 5. ملء بيانات App Store

- الوصف والكلمات المفتاحية
- التصنيف (Rating)
- المعلومات القانونية
- معلومات الاتصال

### 6. الموافقة من Apple

- تستغرق عادة 24-48 ساعة
- قد تطلب Apple معلومات إضافية

---

## خطوات النشر على Google Play (Android)

### 1. إعداد Keystore

```bash
# إنشاء keystore جديد
keytool -genkey -v -keystore royal-voyage.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias royal-voyage

# حفظ كلمة المرور بأمان
```

### 2. إعداد ملف app.config.ts

```typescript
const config: ExpoConfig = {
  android: {
    package: "com.royalvoyage.app",
    versionCode: 1,
  },
};
```

### 3. بناء التطبيق

```bash
# استخدام Expo EAS Build
eas build --platform android --auto-submit

# أو بناء محلي
eas build --platform android
```

### 4. رفع على Google Play Console

```bash
# استخدام Play Console مباشرة
# أو bundletool
bundletool build-apks \
  --bundle=app.aab \
  --output=app.apks \
  --ks=royal-voyage.keystore
```

### 5. ملء بيانات Google Play

- الوصف والكلمات المفتاحية
- لقطات الشاشة
- الفئة العمرية
- المعلومات القانونية

### 6. الموافقة من Google

- تستغرق عادة 2-3 ساعات
- قد تطلب Google معلومات إضافية

---

## متطلبات الخصوصية والأمان

### سياسة الخصوصية

يجب أن تتضمن:
- ما هي البيانات المجمعة
- كيفية استخدام البيانات
- من يمكنه الوصول للبيانات
- حقوق المستخدم

### شروط الخدمة

يجب أن تتضمن:
- شروط الاستخدام
- المسؤولية القانونية
- الترخيص
- الإنهاء

### الأمان

- استخدام HTTPS لجميع الاتصالات
- تشفير البيانات الحساسة
- التحقق من الهوية
- حماية من الهجمات

---

## ملف env المطلوب

```env
# iOS
APPLE_ID=your-apple-id@example.com
APPLE_PASSWORD=your-app-specific-password
APPLE_TEAM_ID=XXXXXXXXXX

# Android
ANDROID_KEYSTORE_PATH=./royal-voyage.keystore
ANDROID_KEYSTORE_PASSWORD=your-keystore-password
ANDROID_KEY_ALIAS=royal-voyage
ANDROID_KEY_PASSWORD=your-key-password

# General
EXPO_TOKEN=your-expo-token
```

---

## اختبار ما قبل النشر

### اختبارات يجب إجراؤها

- [ ] اختبار جميع الميزات على iOS و Android
- [ ] اختبار الدفع على كلا المنصتين
- [ ] اختبار الإشعارات
- [ ] اختبار eSIM Go integration
- [ ] اختبار الأداء والبطارية
- [ ] اختبار الاتصال بالإنترنت
- [ ] اختبار الأمان والخصوصية

### أدوات الاختبار

- Expo Go (للاختبار السريع)
- TestFlight (لاختبار iOS)
- Google Play Beta Testing (لاختبار Android)
- Firebase Test Lab (لاختبار Android)

---

## بعد النشر

### المراقبة

- مراقبة معدل الأخطاء
- مراقبة الأداء
- مراقبة التقييمات والمراجعات
- مراقبة الاستخدام

### التحديثات

- إصلاح الأخطاء والمشاكل
- إضافة ميزات جديدة
- تحسين الأداء
- تحديث الأمان

### الدعم

- الرد على تقييمات المستخدمين
- حل مشاكل المستخدمين
- جمع الملاحظات
- تحسين التطبيق بناءً على الملاحظات

---

## الموارد المفيدة

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Apple App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)
- [TestFlight](https://testflight.apple.com/)
- [Firebase Test Lab](https://firebase.google.com/docs/test-lab)

---

## الدعم

للحصول على الدعم:
- البريد الإلكتروني: support@royalvoyage.online
- الهاتف: +222 XXXX XXXX
- الموقع: https://royalvoyage.online
