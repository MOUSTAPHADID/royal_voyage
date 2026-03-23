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

## تعدد اللغات (i18n)
- [x] إنشاء نظام i18n في lib/i18n.tsx مع دعم ar/fr/en/pt
- [x] إنشاء ملفات الترجمة: locales/ar.ts, fr.ts, en.ts, pt.ts
- [x] دعم RTL للعربية في _layout.tsx
- [x] تحديث شاشة Home بالترجمة
- [x] تحديث شاشة نتائج الرحلات بالترجمة
- [x] تحديث شاشة تفاصيل الرحلة بالترجمة
- [x] تحديث شاشة نتائج الفنادق بالترجمة
- [x] تحديث شاشة تفاصيل الفندق بالترجمة
- [x] تحديث شاشات الحجز والدفع والتأكيد بالترجمة
- [x] تحديث شاشة الملف الشخصي بمحدد اللغة
- [x] تحديث شاشة حجوزاتي بالترجمة
- [x] حفظ اختيار اللغة في AsyncStorage

## الأوقية الموريتانية (MRU)
- [x] إنشاء lib/currency.ts مع دالة تحويل USD → MRU وتنسيق "أوق"
- [x] تحديث شاشة نتائج الرحلات لعرض الأسعار بالأوقية
- [x] تحديث شاشة تفاصيل الرحلة لعرض الأسعار بالأوقية
- [x] تحديث شاشة نتائج الفنادق لعرض الأسعار بالأوقية
- [x] تحديث شاشة تفاصيل الفندق لعرض الأسعار بالأوقية
- [x] تحديث شاشة الدفع لعرض الأسعار بالأوقية

## ميزات جديدة — أطفال، تاريخ ميلاد، تذاكر، إشعارات
- [x] إضافة حقل عدد الأطفال في نموذج البحث (Home)
- [x] تمرير عدد الأطفال إلى شاشة نتائج الرحلات
- [x] إضافة حقل تاريخ الميلاد في نموذج بيانات المسافر
- [x] إنشاء خدمة توليد تذكرة طيران PDF بالإنجليزية
- [x] تضمين معلومات الشركة في التذكرة (+22233700000، royal-voyage@gmail.com، Tavragh Zeina - Nouakchott)
- [x] إضافة زر "تحميل التذكرة" في شاشة التأكيد
- [x] إضافة زر "عرض التذكرة" في شاشة تفاصيل الحجز
- [x] إرسال إشعار محلي عند تأكيد الحجز
- [x] إضافة صفحة إدارة التطبيق (Admin) مع إحصائيات الحجوزات

## Página de Administração (Admin)
- [x] Criar ecrã de administração com estatísticas (total reservas, receita, voos, hotéis)
- [x] Adicionar lista de clientes com histórico de reservas
- [x] Adicionar gráfico de distribuição de reservas (voos vs hotéis)
- [x] Integrar acesso à página admin no perfil
- [x] Proteger a página admin com verificação de credenciais

## إرسال البريد الإلكتروني
- [x] إعداد خدمة nodemailer في الخادم
- [x] إنشاء قالب HTML لتذكرة الطيران بالإنجليزية
- [x] إنشاء قالب HTML لتأكيد حجز الفندق بالإنجليزية
- [x] إضافة route tRPC لإرسال البريد الإلكتروني
- [x] ربط شاشة التأكيد بإرسال البريد تلقائياً
- [x] إضافة زر "إعادة إرسال التذكرة" في شاشة التأكيد

## إصلاح العملة والأرقام
- [x] ضمان عرض الأرقام باللاتينية (0-9) في جميع الأسعار
- [x] ضمان عرض رمز MRU بشكل صحيح في جميع الشاشات
- [x] إصلاح دالة formatAmadeusPriceMRU في lib/currency.ts

## عرض سعر الطفل والبالغ
- [x] إضافة سعر البالغ وسعر الطفل (75%) في شاشة تفاصيل الرحلة
- [x] تحديث ملخص الدفع ليعرض سعر البالغ × عدد البالغين + سعر الطفل × عدد الأطفال
- [x] إضافة سعر الطفل في شاشة تفاصيل الفندق
- [x] تحديث ملخص الدفع للفنادق ليعرض تفصيل الأسعار

## طرق الدفع المحلية (بديل IATA)
- [x] استبدال طرق الدفع الحالية (Card/PayPal/Apple Pay) بطرق محلية
- [x] إضافة الدفع النقدي في المكتب
- [x] إضافة التحويل البنكي (بيانات الحساب)
- [x] إضافة بنكيلي (Bankily)
- [x] إضافة مصاري (Masrvi)
- [x] إضافة Sedad

## تصحيح طرق الدفع
- [x] استبدال "مصاري" بـ "مصرفي" في شاشة الدفع

## إصدار التذكرة مباشرة عند الدفع
- [x] إرسال التذكرة بالبريد الإلكتروني فور تأكيد أي طريقة دفع
- [x] عرض حالة الإرسال في شاشة التأكيد (جاري الإرسال / تم الإرسال / فشل)

## درجات السفر
- [x] إضافة درجة اقتصادية ممتازة (Premium Economy) في شاشة البحث
- [x] إضافة درجة رجال أعمال (Business) في شاشة البحث
- [x] إضافة درجة أولى (First Class) في شاشة البحث

## البحث عن الحجز
- [x] إضافة حقل بحث برقم الحجز والاسم العائلي في شاشة الحجوزات
- [x] عرض نتيجة البحث مع تفاصيل الحجز

## تغيير الحجز واسترداد التذكرة
- [x] إضافة زر "تغيير الحجز" في شاشة تفاصيل الحجز
- [x] إضافة شاشة طلب تعديل الحجز (تاريخ / مقاعد / ملاحظات)
- [x] إضافة زر "استرداد التذكرة" لإعادة إرسال التذكرة بالبريد الإلكتروني

## إصلاح الحجوزات التجريبية
- [x] إزالة الحجوزات الوهمية من mock-data بحيث تبدأ قائمة الحجوزات فارغة لكل مستخدم جديد

## حساب الإدارة المنفصل
- [x] إضافة منطق تسجيل دخول المدير بإيميل وكلمة مرور خاصة
- [x] توجيه المدير مباشرة للوحة الإدارة عند تسجيل الدخول
- [x] إخفاء زر "وصول الإدارة" من شاشة الملف الشخصي للعملاء
- [x] إضافة شاشة تسجيل دخول منفصلة للمدير

## رقم PNR للحجوزات المؤكدة
- [x] إضافة حقل pnr لنوع Booking في mock-data
- [x] توليد PNR فريد (6 أحرف) تلقائياً عند تأكيد الدفع
- [x] عرض PNR بوضوح في شاشة التأكيد
- [x] عرض PNR في شاشة تفاصيل الحجز
- [ ] تضمين PNR في التذكرة المرسلة بالبريد الإلكتروني
