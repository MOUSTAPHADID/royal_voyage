# Royal Voyage — TODO

## Setup & Branding
- [x] Configure theme colors (navy blue + gold palette)
- [x] Generate app logo and update assets
- [x] Update app.config.ts with branding info

## Auth Flow
- [x] Onboarding carousel (3 slides)
- [x] Login screen
- [x] Register screen
- [ ] Forgot password screen (future)

## Navigation
- [x] Tab bar with 4 tabs (Home, Explore, Bookings, Profile)
- [x] Stack navigation for detail/booking flows
- [x] Auth guard (redirect to login if not authenticated)

## Home Screen
- [x] Search widget with Flights/Hotels tabs
- [x] Featured destinations section
- [x] Special deals section

## Search & Results
- [x] Flight search form (origin, destination, dates, passengers)
- [x] Hotel search form (destination, check-in/out, guests)
- [x] Flight results list with filters
- [x] Hotel results list with filters
- [x] Sort options (price, duration, rating)

## Detail Screens
- [x] Flight detail screen (info, amenities, price breakdown)
- [x] Hotel detail screen (amenities, room types, pricing)

## Booking Flow
- [x] Passenger/guest details form
- [x] Payment screen (card input, summary)
- [x] Booking confirmation screen with animation
- [x] Booking reference / QR code

## My Bookings
- [x] Bookings list (all, flights, hotels filter)
- [x] Booking detail screen
- [x] Cancel booking functionality

## Explore Screen
- [x] Destination grid with search and category filters

## Profile & Settings
- [x] Profile screen (user info, avatar, stats)
- [x] Push notifications toggle
- [x] App settings (language, currency)
- [x] Logout

## Data & State
- [x] Mock flight data (6 flights)
- [x] Mock hotel data (6 hotels)
- [x] Mock destination data (6 destinations)
- [x] Bookings state management (AsyncStorage)
- [x] User auth state management

## Integração Amadeus API
- [x] Configurar credenciais AMADEUS_CLIENT_ID e AMADEUS_CLIENT_SECRET
- [x] Instalar SDK amadeus no servidor
- [x] Criar rotas tRPC para pesquisa de voos (Flight Offers Search)
- [x] Criar rotas tRPC para pesquisa de hotéis (Hotel List + Hotel Offers)
- [x] Criar rotas tRPC para pesquisa de aeroportos/cidades (autocomplete)
- [x] Atualizar ecrã Home para usar pesquisa real
- [x] Atualizar ecrã de resultados de voos para usar dados reais
- [x] Atualizar ecrã de resultados de hotéis para usar dados reais
- [x] Tratamento de erros e fallback para dados mock

## Amadeus API — تكامل حقيقي كامل
- [x] تشخيص الاتصال الحالي واختبار كل endpoint
- [x] إصلاح searchLocations لإرجاع بيانات حقيقية
- [x] إصلاح searchFlights مع معالجة أخطاء محسّنة
- [x] إصلاح searchHotels مع بدائل عند عدم توفر العروض
- [x] إزالة useMock من الواجهة — استخدام Amadeus دائماً
- [x] إضافة تسجيل الأخطاء التفصيلي في الخادم

## Round Trip — ذهاب وإياب
- [x] إضافة تبديل One Way / Round Trip في الشاشة الرئيسية
- [x] إضافة حقل تاريخ العودة عند اختيار Round Trip
- [x] تمرير returnDate لـ Amadeus API في البحث
- [x] عرض رحلة الإياب في شاشة النتائج
- [x] عرض تفاصيل كلا الرحلتين في شاشة التفاصيل
- [x] دعم Round Trip في شاشة الحجز والتأكيد

## الأوقية الموريتانية (MRU)
- [x] إضافة ثابت سعر الصرف USD → MRU في lib/currency.ts
- [x] إضافة دالة تنسيق الأوقية (formatMRU)
- [x] تحديث Amadeus API لطلب الأسعار بـ MRU أو تحويلها
- [x] عرض الأسعار بالأوقية في شاشة نتائج الرحلات
- [x] عرض الأسعار بالأوقية في شاشة نتائج الفنادق
- [x] عرض الأسعار بالأوقية في شاشة التفاصيل وشاشة الدفع
- [x] إضافة رمز الأوقية (أوق) بجانب الأسعار

## تعدد اللغات (i18n)
- [ ] إنشاء نظام i18n في lib/i18n.ts مع دعم ar/fr/en/pt
- [ ] إنشاء ملفات الترجمة: locales/ar.ts, fr.ts, en.ts, pt.ts
- [ ] دعم RTL للعربية في _layout.tsx
- [ ] تحديث شاشة Home بالترجمة
- [ ] تحديث شاشة نتائج الرحلات بالترجمة
- [ ] تحديث شاشة نتائج الفنادق بالترجمة
- [ ] تحديث شاشات التفاصيل والحجز والدفع بالترجمة
- [ ] تحديث شاشة الملف الشخصي بالترجمة
- [ ] إضافة محدد اللغة في شاشة الملف الشخصي
- [ ] حفظ اختيار اللغة في AsyncStorage
