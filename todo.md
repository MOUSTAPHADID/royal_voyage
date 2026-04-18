# Royal Service — TODO

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
- [x] Add Activities tab to main search bar alongside Flights and Hotels
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

## PNR في قالب البريد الإلكتروني
- [ ] إضافة حقل pnr اختياري إلى FlightTicketData وHotelConfirmationData في server/email.ts
- [ ] عرض PNR بشكل بارز في قالب HTML للتذكرة
- [ ] تحديث Zod schema في server/routers.ts لقبول pnr
- [ ] تمرير pnr من payment.tsx عند استدعاء mutation البريد

## تذكرة PDF مرفقة بالبريد الإلكتروني
- [x] تثبيت مكتبة pdfkit في الخادم
- [x] إنشاء server/pdf.ts لتوليد تذكرة رحلة PDF
- [x] إنشاء دالة توليد تأكيد فندق PDF
- [x] إرفاق PDF مع البريد الإلكتروني كـ attachment

## إعادة تصميم تذكرة PDF
- [x] إعادة تصميم تذكرة الطيران PDF بشكل جذاب (خط متقطع، باركود، ألوان احترافية)
- [x] إعادة تصميم تأكيد الفندق PDF بنفس الأسلوب

## شعار الخطوط الجوية على التذكرة
- [x] جلب شعارات شركات الطيران الشائعة (20 شركة)
- [x] عرض شعار الخط الجوي على تذكرة PDF

## البحث الصوتي
- [x] إضافة route tRPC لتحويل الصوت إلى نص (speech-to-text) في الخادم
- [x] إنشاء hook useVoiceSearch لإدارة التسجيل والتحويل
- [x] إضافة زر الميكروفون في شاشة Home بجانب حقل البحث
- [x] إضافة واجهة تسجيل صوتي مع مؤشر حركي (موجة صوتية)
- [x] تعبئة حقل الوجهة تلقائياً بعد التعرف على الصوت

## إصلاحات
- [x] إصلاح خطأ __dirname في ملف pdf.ts (غير متوافق مع ES modules)
- [x] إزالة استخدام expo-notifications من الكود (محذوف من Expo Go SDK 53+)
- [x] إضافة طلب أذونات الميكروفون عند بدء التطبيق
- [x] إضافة طلب أذونات الإشعارات بشكل صحيح

## إصلاح زر الميكروفون
- [x] إصلاح عدم ظهور زر الميكروفون في شاشة البحث

## إصلاح زر الميكروفون (المحاولة الثانية)
- [x] إضافة رموز mic.fill و stop.fill و waveform لقاموس الأيقونات (كانت مفقودة فأخفت الزر)

## صفحة سياسة الخصوصية
- [x] إنشاء صفحة سياسة الخصوصية بثلاث لغات (عربي، إنجليزي، فرنسي)
- [x] إضافة مسار /privacy في التطبيق ورابط من شاشة الملف الشخصي

## لقطات شاشة Google Play وبيانات الاتصال
- [x] إنشاء 5 لقطات شاشة احترافية لـ Google Play (1080×1920)
- [x] بيانات الاتصال صحيحة بالفعل (+22233700000, royal-voyage@gmail.com, Tavragh Zeina)

## لقطات شاشة عربية وشاشة Onboarding
- [x] إنشاء 5 لقطات شاشة بالعربية لـ Google Play (1080×1920)
- [x] شاشة Onboarding موجودة بالفعل (تظهر عند أول تشغيل لغير المسجلين)

## أزرار التواصل الاجتماعي
- [x] إضافة زر WhatsApp للتواصل المباشر (+22233700000)
- [x] إضافة زر Facebook في شاشة Profile

## إصلاح زر الميكروفون (المحاولة النهائية)
- [x] إصلاح عدم ظهور زر الميكروفون (كان overflow:hidden يقطع الزر)

## نقل أزرار التواصل الاجتماعي
- [x] إزالة أزرار WhatsApp وFacebook من شاشة Profile
- [x] إضافة أزرار WhatsApp وFacebook في الشاشة الرئيسية Home

## إصلاح خطأ المصادقة
- [ ] تشخيص وإصلاح خطأ "تعذر المصادقة" عند تسجيل الدخول

## تكامل Amadeus API
- [x] إنشاء خدمة Amadeus في الخادم (مصادقة، بحث الرحلات، الأسعار)
- [x] إضافة tRPC routes لـ Amadeus (flightSearch, flightPrice, flightBook)
- [x] تحديث شاشة نتائج الرحلات لاستخدام بيانات Amadeus الحقيقية
- [x] إضافة متغيرات AMADEUS_CLIENT_ID و AMADEUS_CLIENT_SECRET الصحيحة
- [x] تفعيل Amadeus Production API (AMADEUS_PROD_CLIENT_ID و AMADEUS_PROD_CLIENT_SECRET) للبيانات الحقيقية

## رسوم الوكالة
- [x] إضافة ثابت AGENCY_FEE_MRU = 1000 في lib/currency.ts
- [x] إضافة رسوم 1000 أوقية على سعر الرحلة في شاشة تفاصيل الرحلة
- [x] إضافة رسوم 1000 أوقية على سعر الفندق في شاشة تفاصيل الفندق
- [x] عرض الرسوم بشكل منفصل في ملخص الدفع
- [x] تضمين الرسوم في المبلغ الإجمالي المدفوع

## إزالة الضرائب 10%
- [x] حذف سطر "ضرائب ورسوم (10%)" من شاشة تفاصيل الرحلة
- [x] تحديث حساب الإجمالي ليكون: سعر الرحلة + رسوم الخدمة فقط
- [x] حذف سطر الضرائب من شاشة تفاصيل الفندق

## إخفاء رسوم الخدمة
- [x] حذف سطر "رسوم الخدمة" من شاشة تفاصيل الرحلة
- [x] دمج 1000 أوقية في السعر المعروض للزبون مباشرة
- [x] حذف سطر "رسوم الخدمة" من شاشة تفاصيل الفندق

## لوحة إدارة الأسعار
- [x] إنشاء خدمة PricingSettings لحفظ الإعدادات في AsyncStorage
- [x] بناء شاشة admin/pricing.tsx لتعديل رسوم الوكالة وأسعار الصرف
- [x] إضافة رابط "إدارة الأسعار" في لوحة الأدمن
- [x] ربط إعدادات الأسعار بالتسعير الفعلي في شاشات الرحلات والفنادق

## رسوم مختلفة للرحلات الداخلية/الدولية
- [x] إضافة حقل agencyFeeDomesticMRU في PricingSettings
- [x] تحديث شاشة إدارة الأسعار لعرض حقلي الرسوم
- [x] تطبيق الرسوم المناسبة في شاشة تفاصيل الرحلة

## تحديث أسعار الصرف تلقائياً
- [x] إضافة fetchLiveExchangeRates() لجلب أسعار الصرف من open.er-api.com
- [x] إضافة زر "تحديث الأسعار" في شاشة إدارة الأسعار
- [x] عرض تاريخ آخر تحديث لأسعار الصرف

## تقرير الأرباح الشهري
- [x] إضافة تبويب "الأرباح" في لوحة الأدمن
- [x] حساب إجمالي رسوم الوكالة من الحجوزات المؤكدة
- [x] عرض مخطط شهري للأرباح

## تفصيل الأرباح حسب نوع الحجز
- [x] تقسيم الأرباح في التقرير إلى: رحلات داخلية / دولية / فنادق
- [x] عرض عدد الحجوزات والأرباح لكل فئة مع شريط تقدم ملون

## تصدير تقرير الأرباح PDF
- [x] إنشاء شاشة profit-report.tsx مع اختيار الفترة وعرض التفصيل
- [x] تحويل HTML إلى PDF باستخدام expo-print
- [x] مشاركة PDF عبر expo-sharing

## إشعار يومي بالأرباح
- [x] إنشاء lib/daily-profit-notification.ts لجدولة الإشعار اليومي في الساعة 8 مساءً
- [x] إضافة خيار تفعيل/تعطيل في قسم إشعارات الأدمن بشاشة الملف الشخصي

## إدخال PNR يدوياً من الوكيل
- [x] إضافة حقل realPnr في بيانات الحجز (AsyncStorage)
- [x] بناء شاشة admin/manage-pnr.tsx لعرض الحجوزات وتحديث PNR
- [x] إضافة رابط "إدارة PNR" في لوحة الأدمن
- [x] تحديث التذكرة لعرض realPnr إذا وُجد، وإلا PNR الافتراضي
- [x] عرض رسالة توضيحية للزبون حتى يتم تحديث PNR

## تحسينات PNR - الجولة الثانية
- [x] إضافة حقل realPnrUpdatedAt في نموذج Booking
- [x] عرض تاريخ ووقت آخر تحديث لـ PNR في شاشة تفاصيل الحجز
- [x] إضافة PNR الحقيقي في تذكرة PDF والبريد الإلكتروني
- [x] إرسال إشعار محلي فوري للزبون عند تحديث PNR من الأدمن

## إصلاح خطأ وجهة الرحلة
- [x] تشخيص سبب ظهور DXB بدلاً من CMN: كان يحفظ بيانات FLIGHTS المحلية بدلاً من params
- [x] إصلاح منطق payment.tsx لحفظ بيانات الرحلة الحقيقية من Amadeus

## تحسينات بيانات الحجز
- [x] فحص بيانات التذكرة: بيانات الرحلة تُمرَّر صحيحاً من params
- [x] إصلاح حفظ بيانات الفندق: إضافة hotelCity/hotelCountry/hotelStars في params من detail.tsx
- [x] إضافة تحقق من صحة بيانات الرحلة والفندق قبل معالجة الدفع

## إصلاح إشعار تحديث PNR
- [x] تشخيص سبب عدم وصول الإشعار للزبون عند تحديث PNR
- [x] إصلاح منطق الإشعار في شاشة manage-pnr.tsx

## بريد إلكتروني وPush عند تحديث PNR
- [x] إضافة tRPC endpoint sendPnrUpdateEmail في الخادم (server/email.ts + server/routers.ts)
- [x] إضافة Push Notification عبر Expo Push API للزبون (server/routers.ts sendPushNotification)
- [x] تحديث manage-pnr.tsx لاستدعاء الخدمتين عند حفظ PNR
- [x] حفظ passengerEmail في بيانات الحجز (Booking type + payment.tsx)
- [x] إصلاح حفظ بيانات الفندق الحقيقية بدلاً من mock data (payment.tsx + hotels/detail.tsx)
- [x] إزالة سطر الضرائب 10% من شاشة الدفع (payment.tsx)

## تسجيل Push Token عند تسجيل الدخول
- [x] استدعاء registerForPushNotifications() في شاشة تسجيل الدخول بعد النجاح
- [x] حفظ Push Token في app-context عبر saveExpoPushToken()
- [x] تضمين customerPushToken في بيانات الحجز عند الدفع

## حالات تتبع الطلب
- [x] إضافة حالات جديدة: "processing" و"airline_confirmed" في Booking type
- [x] إضافة شاشة admin/update-status.tsx لتغيير حالة الحجز
- [x] إرسال Push Notification عند تغيير الحالة (إذا كان للزبون token)
- [x] عرض الحالة بشكل واضح في شاشة تفاصيل الحجز (ألوان + أيقونات)
- [x] إضافة رابط "تتبع الطلبات" في لوحة الأدمن

## تنبيه انتهاء 24 ساعة للحجز النقدي
- [x] إضافة حقل paymentDeadline في Booking type
- [x] جدولة إشعار محلي قبل ساعة من انتهاء المهلة (23 ساعة من الحجز)
- [x] عرض عداد تنازلي في شاشة تفاصيل الحجز النقدي
- [x] إضافة تنبيه مرئي (برتقالي/أحمر) عند اقتراب الموعد النهائي

## تأكيد الدفع من قبل الإدارة
- [x] إضافة endpoint sendPaymentConfirmation في server/email.ts وserver/routers.ts
- [x] بناء شاشة admin/confirm-payment.tsx لعرض الحجوزات المعلقة وتأكيد دفعها
- [x] عند التأكيد: تغيير الحالة إلى "confirmed" + إرسال بريد احترافي + Push للزبون
- [x] إضافة رابط "تأكيد الدفع" في لوحة الأدمن
- [x] عرض badge بعدد الحجوزات المعلقة بجانب بطاقة تأكيد الدفع
- [x] حفظ paymentMethod في Booking type وpayment.tsx

## إصلاح مشكلة تغير الأسعار بعد الحجز
- [ ] تشخيص مصدر تغير السعر (pricing-settings، تحويل العملة، params)
- [ ] تثبيت السعر المعروض في نتائج البحث عبر جميع شاشات الحجز
- [ ] التأكد من أن السعر المحفوظ في الحجز يطابق ما رآه الزبون

## إصلاح مشكلة تغير الأسعار بعد الحجز
- [x] تحديد مصدر المشكلة: toMRU مضاعف في payment.tsx وconfirmation.tsx وadmin/index.tsx
- [x] إصلاح payment.tsx: إزالة toMRU من عرض الأسعار واستخدام total مباشرة بالأوقية
- [x] إصلاح confirmation.tsx: منع إعادة تحويل السعر عند currency=MRU
- [x] إصلاح bookings.tsx: استبدال $ بـ formatMRU
- [x] إصلاح booking/detail.tsx: استبدال $ بـ formatMRU
- [x] إصلاح admin/index.tsx: إزالة toMRU من القيم المخزّنة بالأوقية
- [x] إضافة priceCurrency في params لمنع إعادة التحويل في passenger-details.tsx

## إصلاح أخطاء expo-notifications وعرض الأسعار
- [x] إصلاح daily-profit-notification.ts: dynamic import لتجنب الخطأ في Expo Go
- [x] إصلاح push-notifications.ts: dynamic import + إصلاح trigger format
- [x] إصلاح عرض السعر في شاشة تفاصيل الرحلة: البادج يعرض السعر شاملاً رسوم الوكالة

## إصلاح شامل لتمرير بيانات الرحلة وعرض الأسعار
- [x] تتبع تدفق بيانات الرحلة: results → detail → passenger-details → payment
- [x] إصلاح خطأ CMN→DXB: عكس أولوية params على mock data في payment.tsx
- [x] توحيد عرض السعر: البادج = الإجمالي شامل رسوم الوكالة
- [x] إصلاح index.tsx: منع البحث بدون وجهة + Alert وإزالة DXB/CMN hardcoded fallbacks
- [x] إصلاح flights/results.tsx: إزالة CMN/DXB hardcoded من Amadeus queries
- [x] إصلاح hotels/results.tsx: إزالة DXB/Dubai hardcoded
- [x] إصلاح confirmation.tsx: إزالة NKC/DST hardcoded fallbacks من البريد والتذكرة
- [x] إصلاح push-notifications.ts: trigger format لتوافق Expo SDK 54

## إرسال تذكرة PDF عند تأكيد شركة الطيران
- [x] قراءة server/pdf.ts وserver/email.ts لفهم بنية توليد PDF وإرساله
- [x] إضافة endpoint sendAirlineConfirmedTicket في server/routers.ts (يولّد PDF + Push)
- [x] تحديث admin/update-status.tsx لاستدعاء الـ endpoint عند airline_confirmed
- [x] إضافة Push Notification للزبون مع رسالة "تذكرتك جاهزة" عند airline_confirmed
- [x] رسائل Alert تُظهر ما تم: إرسال PDF + Push

## تذكرة فندق PDF وزر إعادة الإرسال وحالة الإرسال
- [x] إرسال تذكرة فندق PDF عند airline_confirmed لحجوزات الفنادق في update-status.tsx
- [x] إضافة endpoint sendAirlineConfirmedHotelTicket في server/routers.ts
- [x] إضافة حقل ticketSent في Booking type لتتبع حالة الإرسال
- [x] إنشاء شاشة admin/booking-detail.tsx مع زر إعادة إرسال التذكرة للأدمن
- [x] ربط بطاقات الحجوزات في لوحة الأدمن بشاشة التفاصيل الجديدة
- [x] عرض أيقونة ✉️ في بطاقة الحجز عند ticketSent = true (شاشة الزبون والأدمن)

## تغيير العملة (MRU / USD / EUR / AOA)
- [x] تحديث lib/currency.ts لدعم عملات متعددة (MRU، USD، EUR، AOA) مع أسعار الصرف
- [x] إنشاء CurrencyContext في lib/currency-context.tsx لحفظ العملة المختارة
- [x] ربط CurrencyProvider في app/_layout.tsx
- [x] إضافة قسم "العملة" في شاشة الإعدادات (Profile) مع 4 خيارات
- [x] تطبيق العملة المختارة في شاشة نتائج الرحلات
- [x] تطبيق العملة المختارة في شاشة تفاصيل الرحلة
- [x] تطبيق العملة المختارة في شاشة نتائج الفنادق
- [x] تطبيق العملة المختارة في شاشة تفاصيل الفندق
- [x] تطبيق العملة المختارة في شاشة الدفع
- [x] تطبيق العملة المختارة في شاشة تفاصيل الحجز
- [x] تطبيق العملة المختارة في قائمة الحجوزات

## منتقي التاريخ بالتقويم (Date Picker)
- [x] تثبيت @react-native-community/datetimepicker
- [x] إنشاء مكون DatePickerField مشترك في components/ui/date-picker-field.tsx
- [x] تطبيق DatePicker في حقل تاريخ الذهاب (شاشة Home)
- [x] تطبيق DatePicker في حقل تاريخ الإياب (شاشة Home)
- [x] تطبيق DatePicker في حقل تاريخ الوصول للفندق (شاشة Home)
- [x] تطبيق DatePicker في حقل تاريخ المغادرة للفندق (شاشة Home)
- [x] تطبيق DatePicker في حقل تاريخ الميلاد (passenger-details.tsx)
- [x] تطبيق DatePicker في شاشة تعديل الحجز (booking/change.tsx)

## الدفع عبر PayPal (للدفع بالعملة الأجنبية)
- [x] إضافة PayPal كخيار دفع في شاشة payment.tsx
- [x] عرض السعر بالدولار أو اليورو عند اختيار PayPal
- [x] عرض بريد PayPal وتعليمات الدفع الخطوة بخطوة
- [x] تحديث تسمية PayPal في شاشات الأدمن (confirm-payment + booking-detail)

## تحديثات معلومات الوكالة
- [x] تغيير إيميل التواصل إلى suporte@royalvoyage.online في جميع الملفات
- [x] إضافة "Since 2023" في صفحة Profile وملفات PDF

## Email Forwarding وصفحة About وWhatsApp في PDF
- [x] إعداد Email Forwarding في Resend لـ suporte@royalvoyage.online (يحتاج Cloudflare)
- [x] إنشاء/تحديث صفحة About بتاريخ الوكالة منذ 2023 وخدماتها
- [x] إضافة رقم WhatsApp في تذاكر PDF

## إصلاح نظام الحجز على الموقع
- [ ] تشخيص مشكلة الحجز على royalvoyage.online
- [ ] إصلاح المشكلة
- [ ] نشر التحديث

## إصلاح شاشة Home الفارغة
- [x] إصلاح crash بسبب useAudioRecorder في VoiceSearchModal (تأخير render حتى فتح Modal)

## حذف خدمة Render.com
- [x] حذف خدمة Render.com عبر API

## إخفاء عناصر الإدارة عن الزبائن
- [ ] إخفاء زر "لوحة الإدارة" عن الزبائن العاديين
- [ ] إخفاء قسم "إشعارات الأدمن" عن الزبائن العاديين
- [ ] إبقاء "عن الوكالة" و"سياسة الخصوصية" مرئية للجميع

## إصلاح توجيه المدير
- [ ] إصلاح عدم توجيه المدير إلى لوحة الإدارة عند تسجيل الدخول بحساب الأدمن

## إدخال رقم التذكرة وPNR من الإدارة
- [x] إضافة شاشة/نموذج لإدخال رقم التذكرة (Ticket Number) مع PNR في لوحة الإدارة
- [x] ربط رقم التذكرة وPNR بالحجز المحدد
- [x] عرض رقم التذكرة وPNR في تفاصيل الحجز للزبون

## تضمين رقم التذكرة في تذكرة PDF
- [x] إضافة Ticket Number في ملف PDF للرحلات (server/pdf.ts)
- [x] إضافة Ticket Number في ملف PDF للفنادق (server/pdf.ts)
- [x] تمرير ticketNumber من admin/update-status.tsx عند إرسال التذكرة

## إصلاح توجيه المدير
- [x] إصلاح عدم توجيه المدير تلقائياً للوحة الإدارة عند تسجيل الدخول
- [x] إصلاح التوجيه عند إعادة فتح التطبيق (المدير يذهب للوحة الإدارة مباشرة)

## فلتر حسب حالة التذكرة
- [x] إضافة فلتر "الكل" في شاشة إدارة PNR
- [x] إضافة فلتر "بدون تذكرة" لتصفية الحجوزات بدون رقم تذكرة
- [x] إضافة فلتر "بدون PNR" لتصفية الحجوزات بدون PNR حقيقي
- [x] إضافة فلتر "مكتمل" (PNR + رقم تذكرة)
- [x] عرض عدد الحجوزات لكل فلتر

## إخفاء عناصر الإدارة عن الزبائن
- [x] إخفاء زر "لوحة الإدارة" من شاشة Profile للزبائن العاديين
- [x] إخفاء قسم "إشعارات الأدمن" من شاشة Profile للزبائن العاديين
- [x] إبقاء "عن الوكالة" و"سياسة الخصوصية" مرئية للجميع

## فلتر حسب الحالة في شاشة تتبع الطلبات
- [x] إضافة تبويبات فلتر (الكل / معلق / قيد المعالجة / مؤكد / ملغى) في admin/update-status.tsx
- [x] عرض عدد الحجوزات لكل حالة
- [x] تطبيق الفلتر على قائمة الحجوزات

## إصلاح مشكلة تغير الأسعار بعد الحجز
- [x] تتبع تدفق السعر من نتائج البحث حتى الحجز النهائي
- [x] توحيد toMRU لاستخدام أسعار PricingSettings المحدثة بدلاً من الثوابت
- [x] التأكد من أن السعر المحفوظ في الحجز يطابق ما رآه الزبون

## تنبيه المدير عند حجز جديد
- [x] حفظ Push Token الخاص بالمدير في AsyncStorage عند تسجيل الدخول
- [x] إرسال إشعار Push للمدير عند إنشاء حجز جديد من زبون
- [x] تضمين تفاصيل الحجز (المرجع، النوع، اسم الزبون، المبلغ) في الإشعار

## صوت مميز لإشعار الحجز الجديد
- [x] تحميل صوت إشعار مميز للحجوزات الجديدة (new_booking.wav)
- [x] إنشاء Android notification channels بصوت مخصص (new_booking + booking_cancelled)
- [x] تسجيل الصوت في expo-notifications plugin في app.config.ts
- [x] تمرير sound وchannelId في Push Notification للحجز الجديد والإلغاء

## شاشة سجل الإشعارات للمدير
- [x] إنشاء نموذج AdminNotification وتخزينه في AsyncStorage (lib/admin-notifications.ts)
- [x] إنشاء شاشة admin/notifications.tsx لعرض سجل الإشعارات
- [x] إضافة زر الانتقال لتفاصيل الحجز من كل إشعار
- [x] إضافة زر سجل الإشعارات في لوحة الإدارة
- [x] حفظ إشعارات الحجز الجديد في السجل من payment.tsx
- [x] قراءة الكل / مسح الكل / تعليم كمقروء

## إشعار عند إلغاء حجز من الزبون
- [x] إرسال إشعار Push للمدير عند إلغاء حجز من الزبون (booking/detail.tsx)
- [x] تضمين تفاصيل الحجز الملغى (النوع، الاسم، الوجهة، المبلغ، المرجع)
- [x] حفظ إشعار الإلغاء في سجل الإشعارات
- [x] استخدام channelId مخصص (booking_cancelled) لإشعار الإلغاء

## إصلاح: لوحة الإدارة تظهر للزبون
- [x] فحص شاشة Profile - الكود الحالي صحيح (قسم الإدارة محذوف من menuSections)
- [x] المشكلة كانت في النسخة المنشورة القديمة - تحتاج إعادة نشر

## إصلاح التسجيل وتسجيل الدخول
- [x] إعادة تصميم شاشة تسجيل الدخول بتصميم لائق واحترافي
- [x] إضافة تسجيل الدخول برقم الهاتف
- [x] إضافة خيار "المتابعة كضيف" بدون تسجيل
- [x] إضافة شاشة التسجيل (اسم + هاتف + إيميل اختياري)
- [x] إرسال كود تحقق عبر إشعار Push عند التسجيل
- [x] إضافة شاشة إدخال كود التحقق

## تعديل الملف الشخصي
- [x] إنشاء شاشة profile/edit.tsx (اسم، هاتف، بريد، جنسية، رقم جواز)
- [x] ربط زر "تعديل الملف" في Profile بالشاشة الجديدة
- [x] حفظ التعديلات عبر updateUser في app-context

## إظهار طرق الدفع في Profile
- [x] إنشاء شاشة profile/payment-methods.tsx (Bankily, Masrivi, Sedad, نقد، تحويل بنكي)
- [x] ربط زر "طرق الدفع" في Profile بالشاشة الجديدة

## إضافة PayPal كطريقة دفع بالبطاقة
- [x] PayPal موجود بالفعل في شاشة الدفع (payment.tsx) - تم تحديث الوصف ليشمل البطاقة
- [x] إضافة PayPal في شاشة طرق الدفع (profile/payment-methods.tsx)
- [x] تحديث وصف PayPal: "ادفع بالبطاقة البنكية (Visa, Mastercard) أو رصيد PayPal"

## رابط مباشر لـ PayPal
- [x] إضافة زر "فتح PayPal" في تعليمات الدفع عبر PayPal
- [x] فتح تطبيق/موقع PayPal تلقائياً مع البريد الإلكتروني والمبلغ

## تأكيد الدفع من المدير
- [x] تحديث شاشة admin/confirm-payment.tsx بإضافة زر رفض الدفع مع سبب الرفض
- [x] عرض transferRef في تفاصيل الدفع
- [x] إضافة دوال confirmBookingPayment وrejectBookingPayment في app-context
- [x] إضافة حقول paymentConfirmed/paymentRejected في Booking type
- [x] عرض حالة الدفع (مؤكد/مرفوض) في booking/detail.tsx للزبون

## إشعار للزبون عند تأكيد الدفع
- [x] إرسال Push notification للزبون عند تأكيد الدفع من المدير
- [x] إرسال إشعار عند رفض الدفع مع سبب الرفض
- [x] حفظ الإشعار في سجل إشعارات المدير

## إشعار بريد إلكتروني عند تأكيد الدفع
- [ ] إنشاء قالب HTML لتأكيد استلام الدفع في server/email.ts
- [ ] إضافة route tRPC لإرسال بريد تأكيد الدفع
- [ ] استدعاء إرسال البريد من شاشة confirm-payment.tsx عند تأكيد الدفع
- [ ] تضمين تفاصيل الحجز وطريقة الدفع والمبلغ في البريد

## تقرير مالي للمدير
- [x] إنشاء شاشة admin/financial-report.tsx
- [x] عرض ملخص الإيرادات اليومية والشهرية
- [x] تفصيل حسب طريقة الدفع (بنكيلي، مصرفي، سداد، PayPal، نقد، تحويل) مع ألوان وأيقونات مميزة
- [x] عرض عدد الحجوزات المؤكدة والمعلقة والملغاة
- [x] إضافة رابط التقرير في لوحة الإدارة
- [x] شريط نسبة مئوية لكل طريقة دفع
- [x] تضمين تفصيل طرق الدفع في PDF المُصدَّر

## رفع إيصال الدفع من الزبون
- [x] إضافة زر رفع صورة الإيصال في شاشة الدفع (payment.tsx)
- [x] استخدام expo-image-picker لاختيار الصورة من المعرض أو الكاميرا
- [x] حفظ الصورة (URI) في بيانات الحجز (receiptImage, receiptImageAt)
- [x] عرض صورة الإيصال في شاشة تأكيد الدفع للمدير مع معاينة كاملة
- [x] إضافة دالة updateBookingReceipt في AppContext
- [x] إضافة أيقونات camera.fill, photo.fill, eye.fill في icon-symbol.tsx
- [x] إضافة حقلي receiptImage و receiptImageAt في نوع Booking

## إضافة وسيلة الدفع Multicaixa Express (AOA)
- [x] إضافة عملة AOA في نظام العملات (currency.ts) مع سعر الصرف (كانت موجودة مسبقاً)
- [x] إضافة Multicaixa Express كوسيلة دفع في شاشة الدفع (payment.tsx) مع لون #E31937 وعلم 🇦🇴
- [x] إضافة رقم محفظة Multicaixa Express في WALLET_NUMBERS
- [x] إضافة تعليمات الدفع عبر Multicaixa Express مع عرض المبلغ بالـ AOA وتحذير سعر الصرف
- [x] تحديث PAYMENT_LABELS في confirm-payment.tsx
- [x] تحديث PAYMENT_METHOD_CONFIG في profit-report.tsx
- [x] تحديث PDF التقرير ليشمل Multicaixa Express (يظهر تلقائياً من PAYMENT_METHOD_CONFIG)

## تحسينات Multicaixa Express
- [x] تحديث رقم محفظة Multicaixa Express بالبيانات الفعلية (IBAN: 0055 0000 76790864101 08 / ANGOLAMIR COMERCIO E SERVICOS LDA)
- [x] إضافة حقل aoaToMRU في PricingSettings لسعر صرف AOA قابل للتعديل (افتراضي: 0.043)
- [x] تحديث currency.ts لاستخدام سعر AOA الديناميكي من PricingSettings
- [x] تحديث شاشة إعدادات المدير لعرض حقل سعر صرف AOA + تحديث تلقائي من API
- [x] إضافة زر فتح تطبيق Multicaixa Express مباشرة (deep link + fallback إلى Play Store)

## تحسينات Multicaixa Express - الجولة الثانية
- [x] إضافة زر نسخ رقم IBAN بنقرة واحدة مع haptic feedback وتغيير اللون عند النسخ
- [x] إضافة إشعار تلقائي للمدير عند استلام دفعة Multicaixa Express (محلي + push)
- [x] عرض سعر الصرف الحالي (1 AOA = X MRU) وتاريخ آخر تحديث في شاشة الدفع

## تحسين الانتقال المباشر لتطبيق Multicaixa Express
- [x] البحث عن deep link / package name الصحيح (com.sibsint.mcxwallet)
- [x] تحديث زر فتح التطبيق بالروابط الصحيحة (Android intent URI + iOS canOpenURL + Web fallback)
- [x] Fallback سلس: تطبيق → Play Store/App Store → multicaixa.ao

## تحديث بريد PayPal
- [x] تحديث بريد PayPal إلى angolamirlda@gmail.com في شاشة الدفع (زر الدفع + تعليمات الخطوات)

## إصلاح رابط الدفع عبر PayPal
- [x] استبدال رابط webscr المعطل بـ paypal.me/angolamir مع فتح التطبيق مباشرة
- [x] Fallback سلس: تطبيق PayPal (Android intent/iOS scheme) → paypal.me → paypal.com

## دمج أزرار PayPal المستضافة (Hosted Buttons)
- [x] إنشاء صفحة ويب على السيرفر /api/paypal-checkout مع PayPal Hosted Button (HS2AES3UYJHQA)
- [x] تحديث زر PayPal في شاشة الدفع لفتح الصفحة المستضافة مع fallback إلى paypal.me/angolamir
- [x] تمرير المبلغ والعملة واسم الزبون كمعاملات URL

## تحسين تدفق PayPal - الجولة الثالثة
- [x] إنشاء صفحة "تم الدفع بنجاح" (/api/paypal-success) مع رقم المعاملة وزر نسخ وتصميم أخضر
- [x] إضافة onApprove callback في صفحة PayPal checkout لتوجيه الزبون تلقائياً
- [x] إنشاء POST /api/paypal-notify لتسجيل الدفعات + GET /api/paypal-notifications للمدير
- [x] فصل HTML إلى paypal-pages.ts لتجنب مشاكل template literals

## تحسين تدفق PayPal - الجولة الرابعة
- [x] ربط إشعارات PayPal من السيرفر بلوحة إشعارات المدير (sync عند فتح/تحديث الشاشة + أيقونة PayPal زرقاء)
- [x] إضافة تحقق من صحة الدفعة عبر PayPal Orders API (PAYPAL_CLIENT_SECRET إن وُجد)
- [x] إضافة زر "العودة إلى Royal Service" بـ deep link + زر "إغلاق الصفحة"

## تعديل تدفق الحجز: الدفع قبل الحجز
- [x] تعديل شاشة الدفع: الزر معطل حتى يتم اختيار وسيلة دفع + إدخال المرجع
- [x] منع إتمام الحجز بدون اختيار وسيلة دفع (Alert + disabled button)
- [x] حالة الحجز: "مؤكد" للدفع الإلكتروني، "معلق" للدفع النقدي
- [x] نص الزر: "تأكيد الدفع وإتمام الحجز" / "تأكيد الحجز والدفع لاحقاً"

## مؤقت عد تنازلي في شاشة الدفع
- [x] إضافة مؤقت 15 دقيقة في أعلى شاشة الدفع لحجز المقعد مؤقتاً
- [x] تغيير لون المؤقت: أزرق (>3د) → أصفر (3-1د) → أحمر (<1د)
- [x] إلغاء الحجز وإعادة التوجيه تلقائياً عند انتهاء المؤقت مع Alert

## رسالة WhatsApp بعد الدفع
- [x] إضافة زر "إرسال التأكيد عبر WhatsApp" بلون أخضر (#25D366) في شاشة التأكيد
- [x] تضمين كل تفاصيل الحجز (PNR، المرجع، المبلغ، المسار) في رسالة WhatsApp

## شاشة ملخص الحجز قبل الدفع
- [x] إنشاء شاشة booking/summary.tsx مع تصميم بطاقات منظمة
- [x] عرض تفاصيل الرحلة/الفندق + بيانات المسافر + ملخص التكلفة + تنبيه
- [x] زر "المتابعة إلى الدفع" + زر "تعديل البيانات"
- [x] تعديل passenger-details للتوجيه إلى /booking/summary بدل /booking/payment

## شاشة عروض اليوم
- [x] إنشاء شاشة deals.tsx مع عروض وخصومات خاصة على وجهات محددة
- [x] عرض بطاقات العروض مع السعر الأصلي والسعر المخفض ونسبة الخصم
- [x] إضافة مؤقت عد تنازلي لانتهاء العرض
- [x] ربط العروض بشاشة الحجز مباشرة
- [x] إضافة رابط العروض في الشاشة الرئيسية

## تتبع حالة الرحلة
- [x] إنشاء شاشة flight-status.tsx لتتبع حالة الرحلة
- [x] عرض حالة الرحلة (في الموعد، تأخير، إلغاء)
- [x] عرض بوابة الصعود ورقم المقعد
- [x] خط زمني مرئي لمراحل الرحلة (check-in → boarding → takeoff → landing)
- [x] إضافة رابط تتبع الرحلة في شاشة تفاصيل الحجز

## إرسال التذكرة عبر WhatsApp
- [x] إنشاء تذكرة رقمية بتصميم احترافي تحتوي على كل بيانات الرحلة
- [x] بيانات الاتصال: +22233700000, royal-voyage@gmail.com, tavragh zeina-nouakchoutt
- [x] التذكرة باللغة الإنجليزية
- [x] زر إرسال التذكرة عبر WhatsApp في شاشة تفاصيل الحجز
- [x] إرسال التذكرة كنص منسق عبر WhatsApp (مع fallback للمشاركة العامة)

## تسجيل الوصول الإلكتروني (Online Check-in)
- [x] إنشاء شاشة online-checkin.tsx مع نموذج تسجيل الوصول
- [x] اختيار المقعد (نافذة / ممر / وسط) مع خريطة مقاعد مرئية
- [x] إضافة بيانات المسافر (جواز السفر، الجنسية، تاريخ الميلاد)
- [x] إنشاء بطاقة صعود رقمية (Boarding Pass) مع بيانات كاملة
- [x] حفظ حالة تسجيل الوصول في بيانات الحجز
- [x] إضافة زر "تسجيل الوصول" في شاشة تفاصيل الحجز
- [x] تسجيل المسار في _layout.tsx

## مشاركة بطاقة الصعود عبر WhatsApp
- [x] إنشاء نص بطاقة صعود منسق للمشاركة عبر WhatsApp
- [x] إضافة زر مشاركة بطاقة الصعود عبر WhatsApp في شاشة تسجيل الوصول
- [x] إضافة زر مشاركة عام (Native Share) كبديل
- [x] تضمين بيانات الرحلة والمقعد ومجموعة الصعود في الرسالة

## إشعار تذكيري قبل الرحلة
- [x] جدولة إشعار محلي قبل موعد الرحلة بساعتين
- [x] تضمين رقم الرحلة والمقعد ومجموعة الصعود في الإشعار
- [x] جدولة تلقائية عند تأكيد تسجيل الوصول

## ترقية المقعد (Extra Legroom)
- [x] إضافة خيار ترقية المقعد مع رسوم إضافية في شاشة اختيار المقعد
- [x] عرض سعر الترقية بوضوح (مساحة إضافية للأرجل)
- [x] تمييز مقاعد Extra Legroom بشكل مرئي مختلف
- [x] حفظ حالة الترقية في بيانات الحجز

## تغيير المقعد بعد تسجيل الوصول
- [x] إنشاء شاشة change-seat.tsx لتغيير المقعد بعد تسجيل الوصول
- [x] عرض خريطة المقاعد مع المقعد الحالي مميزاً
- [x] إضافة رسوم تغيير المقعد (300 أوقية)
- [x] حفظ عدد مرات تغيير المقعد والرسوم الإجمالية
- [x] إضافة زر تغيير المقعد في شاشة تفاصيل الحجز (يظهر فقط بعد تسجيل الوصول)
- [x] تسجيل المسار في _layout.tsx

## اختيار وجبة الطعام أثناء تسجيل الوصول
- [x] إضافة خطوة اختيار الوجبة في تسجيل الوصول (info → seat → meal → confirm → done)
- [x] خيارات: وجبة عادية / نباتية / حلال / بدون وجبة
- [x] عرض اختيار الوجبة في صفحة المراجعة
- [x] حفظ اختيار الوجبة في بيانات الحجز

## شاشة ملخص الرحلة وقائمة التحقق
- [x] إنشاء شاشة travel-checklist.tsx مع 4 فئات (وثائق / تعبئة / مطار / صحة)
- [x] قائمة تحقق: جواز السفر، التأشيرة، تذكرة الطيران، الأمتعة، التأمين
- [x] شريط تقدم مرئي مع نسبة إكمال
- [x] حفظ حالة التحقق في بيانات الحجز
- [x] إضافة زر قائمة التحقق في شاشة تفاصيل الحجز
- [x] تسجيل المسار في _layout.tsx

## إصلاح دفع PayPal - تعبئة المبلغ تلقائياً
- [x] تمرير المبلغ المطلوب مسبقاً في رابط PayPal بحيث يكون جاهزاً للدفع مباشرة
- [x] عدم إظهار حقل إدخال المبلغ فارغاً للعميل

## إرسال التذكرة/الحجز كـ PDF عبر WhatsApp
- [x] إنشاء PDF للتذكرة محلياً في التطبيق (expo-print + HTML احترافي)
- [x] إرسال PDF عبر WhatsApp باستخدام expo-sharing API
- [x] زر إرسال التذكرة PDF عبر WhatsApp في شاشة تفاصيل الحجز
- [x] زر مشاركة PDF عام (بريد/تطبيقات أخرى)
- [x] Fallback للنص عبر WhatsApp إذا فشل PDF

## زر الحجز يذهب مباشرة للدفع
- [x] تعديل تدفق الحجز: بيانات المسافر → الدفع مباشرة (تخطي صفحة الملخص)
- [x] تمرير جميع بيانات المسافر مباشرة لصفحة الدفع

## دمج Amadeus API لـ PNR حقيقي
- [x] البحث عن Amadeus Flight Create Orders API
- [x] إنشاء خدمة Amadeus على السيرفر (priceFlightOffer + createFlightOrder)
- [x] إضافة tRPC endpoint bookFlightWithPNR لإنشاء PNR حقيقي
- [x] إضافة cache للـ rawOffer عند البحث واسترجاعه عند الحجز
- [x] ربط تدفق الحجز بـ Amadeus API بعد الدفع مع fallback لـ PNR محلي
- [x] عرض PNR الحق

## إصلاح تأكيد PNR - ticketingAgreement
- [x] تغيير ticketingAgreement من DELAY_TO_CANCEL إلى CONFIRM في createFlightOrder
- [x] التأكد من أن الحجز يُؤكد مباشرة عند الإنشاء

## استرجاع حالة PNR عبر Amadeus
- [x] إضافة دالة getFlightOrder في server/amadeus.ts لاسترجاع حالة الحجز
- [x] إضافة tRPC endpoint لاسترجاع حالة PNR
- [x] إنشاء شاشة pnr-status.tsx لعرض حالة الحجز (مؤكد/معلق/ملغى)
- [x] عرض تفاصيل الحجز من Amadeus (الرحلة، المسافرين، حالة التذكرة)
- [x] إضافة رابط للشاشة من تفاصيل الحجز والشاشة الرئيسية

## إلغاء الحجز عبر Amadeus API
- [x] إضافة دالة cancelFlightOrder في server/amadeus.ts
- [x] إضافة tRPC endpoint لإلغاء الحجز
- [x] إضافة زر إلغاء الحجز عبر Amadeus في شاشة حالة PNR
- [x] تحديث حالة الحجز المحلي بعد الإلغاء الناجح

## تفعيل مفاتيح Amadeus Production
- [x] إعداد السيرفر للتبديل التلقائي بين Test و Production
- [x] التأكد من أن السيرفر يستخدم Production API عند توفر المفاتيح
- [ ] طلب مفاتيح AMADEUS_PROD_CLIENT_ID و AMADEUS_PROD_CLIENT_SECRET من المستخدم

## ربط Amadeus Office ID
- [x] إضافة متغير بيئة AMADEUS_OFFICE_ID
- [x] تمرير Office ID في createFlightOrder (queuingOfficeId)
- [x] تسجيل Office ID في سجل السيرفر عند بدء التشغيل
- [x] طلب Office ID من المستخدم (NKC26239A)

## عرض Office ID في لوحة الإدارة
- [x] عرض Office ID وحالة الاتصال بـ Amadeus في لوحة الإدارة
- [x] إحصائيات الحجوزات المرتبطة بالـ Office ID (عدد الحجوزات، الإيرادات)
- [x] عرض حالة البيئة (Test/Production)

## إصدار التذاكر عبر Amadeus API
- [x] إضافة دالة checkTicketIssuance في server/amadeus.ts
- [x] إضافة tRPC endpoint لفحص إصدار التذكرة
- [x] إضافة زر "التحقق من إصدار التذكرة" في لوحة الإدارة لكل حجز
- [x] تحديث حالة الحجز بعد العثور على التذكرة
- [x] إضافة زر عرض حالة PNR من Amadeus في تفاصيل الحجز

## تقارير المبيعات اليومية/الشهرية
- [x] إنشاء شاشة تقارير المبيعات في لوحة الإدارة
- [x] عرض المبيعات اليومية (آخر 30 يوم) مع أشرطة تقدم
- [x] عرض المبيعات الشهرية (آخر 12 شهر) مع تفصيل طرق الدفع
- [x] ملخص الإيرادات حسب طريقة الدفع
- [x] ملخص الإيرادات حسب نوع الحجز (رحلات داخلية/دولية/فنادق)
- [x] تصدير التقارير كملف PDF مع مشاركة

## زر مخفي للوصول للوحة الإدارة من Profile
- [x] إضافة ضغط مطوّل على نص الإصدار "Royal Service v1.0.0" يفتح نافذة PIN
- [x] عند إدخال PIN صحيح يتم فتح لوحة الإدارة مباشرة

## تحسينات أمان لوحة الإدارة
- [x] تغيير رمز PIN من داخل لوحة الإدارة مع حفظ في AsyncStorage
- [x] حد أقصى 3 محاولات لإدخال PIN مع قفل مؤقت (5 دقائق)
- [x] عداد تنازلي للقفل المؤقت في واجهة المستخدم
- [x] تسجيل دخول بالبصمة (Face ID / Fingerprint) للوحة الإدارة
- [x] تفعيل/تعطيل البصمة من إعدادات لوحة الإدارة
- [x] التحقق من البصمة قبل تفعيلها

## ربط Amadeus Consolidator لإصدار التذاكر
- [x] إضافة إعداد Consolidator Office ID في السيرفر (NKC262203A)
- [x] إضافة ticketingAgreement DELAY_TO_QUEUE في Flight Create Orders
- [x] إضافة دالة queueToConsolidator لإرسال PNR للـ Consolidator
- [x] إضافة tRPC endpoints (queueToConsolidator + getConsolidatorConfig)
- [x] إضافة متابعة حالة التذكرة عبر checkTicketIssuance
- [x] إضافة بطاقة Consolidator في لوحة الإدارة مع حالة الاتصال
- [x] إضافة زر "إرسال PNR إلى Consolidator" في تفاصيل الحجز (Admin)

## تغيير Consolidator Office ID من لوحة الإدارة
- [x] إضافة حقل تعديل Consolidator Office ID في إعدادات الأمان بلوحة الإدارة
- [x] حفظ القيمة الجديدة في AsyncStorage وتحديث السيرفر عبر tRPC
- [x] عرض القيمة الحالية مع إمكانية التعديل

## متابعة تلقائية لحالة التذاكر مع إشعار
- [x] إضافة polling دوري كل 60 ثانية لفحص حالة التذاكر المعلقة عبر checkTicketIssuance
- [x] إرسال إشعار محلي عند اكتشاف إصدار تذكرة جديدة (عنوان + رقم التذكرة)
- [x] تحديث حالة الحجز المحلي تلقائياً (ticketNumber + airline_confirmed)
- [x] بطاقة متابعة التذاكر في لوحة الإدارة مع زر فحص يدوي + تفعيل/تعطيل

## إضافة Consolidator LAD282354 + عملة AOA
- [x] تحويل النظام من Consolidator واحد إلى متعدد (Multi-Consolidator)
- [x] إضافة LAD282354 بعملة AOA (كوانزا أنغولية)
- [x] ربط Consolidator LAD282354 بعملة AOA للتذاكر المُصدرة
- [x] تحديث لوحة الإدارة لعرض Consolidators متعددة مع إضافة/حذف/تبديل
- [x] إضافة اختيار العملة (MRU/AOA/EUR/USD/XOF) عند إضافة وسيط
- [x] AOA Multicaixa Express مدعوم بالفعل في طرق الدفع

## استبدال Amadeus API بـ Duffel API
- [x] البحث عن وثائق Duffel API وفهم الفروقات
- [x] طلب مفتاح Duffel API من المستخدم (DUFFEL_API_TOKEN)
- [x] تثبيت @duffel/api SDK
- [x] إنشاء server/duffel.ts بدلاً من server/amadeus.ts
- [x] تحديث tRPC routes لاستخدام Duffel (searchFlights, searchHotels, bookFlightWithPNR, getFlightOrder, cancelFlightOrder, checkTicketIssuance, consolidator)
- [x] تحديث شاشات البحث والحجز والإلغاء وBooking Status
- [x] تحديث لوحة الإدارة (Duffel API بدل Amadeus GDS)
- [x] تحديث admin/booking-detail.tsx (أزرار التحقق والحالة)
- [x] اختبارات Duffel Integration (9 اختبارات ناجحة)
- [x] إزالة ملف amadeus.ts وملفات الاختبار القديمة

## اختبار Duffel API الحقيقي وتنظيف Amadeus
- [x] اختبار بحث حقيقي عن رحلة NKC → CMN عبر Duffel API (5 رحلات حقيقية)
- [x] إزالة ملف amadeus.ts القديم وملفات الاختبار المعتمدة عليه

## اختبار حجز كامل عبر Duffel + PNR في البريد الإلكتروني
- [x] اختبار تدفق الحجز الكامل عبر Duffel API (23 اختبار ناجح + بحث حقيقي curl)
- [x] إضافة حقل pnr إلى FlightTicketData وHotelConfirmationData في server/email.ts (كان موجوداً بالفعل)
- [x] عرض PNR بشكل بارز في قالب HTML للتذكرة (كان موجوداً بالفعل — صندوق ذهبي كبير)
- [x] تحديث Zod schema في server/routers.ts لقبول pnr (كان موجوداً بالفعل)
- [x] تمرير pnr من payment.tsx عند استدعاء mutation البريد (كان موجوداً بالفعل)
- [x] إصلاح confirmation.tsx — تمرير pnr عند إعادة إرسال البريد الإلكتروني
- [x] إصلاح use-ticket-polling.ts — تحديث التعليقات والمسار لاستخدام Duffel API

## إصلاح مشكلة السعر المضروب في 2
- [x] إصلاح السعر المضاعف لرحلات الذهاب والإياب — إزالة ×2 و×عدد الركاب (Duffel total_amount شامل)

## اختبار حجز كامل + Ticket Number + تنظيف أسماء المتغيرات
- [x] اختبار تدفق الحجز الكامل — 21 اختبار ناجح للتحقق من السعر الصحيح في كل المراحل
- [x] إضافة Ticket Number في شاشة التأكيد (confirmation.tsx)
- [x] إضافة Ticket Number في قالب البريد الإلكتروني (email.ts) — صندوق أزرق داكن بعد PNR
- [x] إضافة Ticket Number في شاشة تفاصيل الحجز (booking/detail.tsx) — كان موجوداً بالفعل
- [x] إعادة تسمية amadeusOrderId إلى duffelOrderId في mock-data.ts (مع backward compat)
- [x] إعادة تسمية amadeusOrderId إلى duffelOrderId في app-context.ts (لم يكن موجوداً)
- [x] تحديث جميع الملفات لاستخدام duffelOrderId مع fallback إلى amadeusOrderId (booking-detail, admin/booking-detail, use-ticket-polling, payment)

## إعادة تسمية حقل Order ID
- [x] تغيير amadeusOrderId/duffelOrderId إلى royalOrderId في جميع الملفات (mock-data, payment, detail, admin/booking-detail, use-ticket-polling, tests)

## إضافة الرضيع (Infant) في البحث والحجز
- [x] إضافة عداد الرضع في شاشة البحث (tabs/index.tsx)
- [x] تحديث Duffel API لإرسال infant_without_seat في البحث (duffel.ts + routers.ts + results.tsx)
- [x] تحديث شاشة تفاصيل الرحلة لعرض عدد الرضع
- [x] تحديث passenger-details.tsx لتمرير infants
- [x] تحديث تدفق الحجز (summary, payment, confirmation) لتمرير infants
- [x] تحديث قوالب البريد وPDF وticket-generator وpdf-ticket-generator لعرض الرضع

## حجز مؤكد لمدة 24 ساعة (Hold Order) عند الدفع في المكتب
- [x] إضافة دالة createHoldOrder في server/duffel.ts (حجز مؤقت)
- [x] إضافة دالة payForHoldOrder في server/duffel.ts (دفع لإصدار التذكرة)
- [x] إضافة tRPC routes holdFlightOrder وpayHoldOrder في server/routers.ts
- [x] تحديث payment.tsx — استخدام holdFlightOrder عند اختيار "دفع نقدي" مع fallback
- [x] عرض مهلة الدفع (payment_required_by) — Duffel deadline أو fallback 24h
- [x] تحديث confirm-payment.tsx — استدعاء payHoldOrder عند تأكيد الدفع لإصدار التذكرة

## نموذج بيانات الرضيع (اسم + تاريخ ميلاد)
- [x] إضافة نموذج إدخال اسم الرضيع وتاريخ ميلاده في passenger-details.tsx
- [x] تمرير بيانات الرضيع عبر تدفق الحجز (summary → payment → Duffel)
- [x] تحديث Duffel createFlightOrder لتضمين بيانات الرضيع (type: infant_without_seat)
- [x] إضافة التحقق من عمر الرضيع (أقل من سنتين)
- [x] تحديث holdFlightOrder لتضمين بيانات الرضيع

## عرض سعر الرضيع منفصلاً
- [x] استخراج سعر الرضيع من Duffel API (passenger type pricing)
- [x] عرض سعر الرضيع منفصلاً في شاشة تفاصيل الرحلة
- [x] عرض أسعار البالغين والأطفال والرضع بشكل منفصل في تفصيل الأسعار

## لوحة تحكم إدارية متقدمة
- [x] إعادة تصميم لوحة الإدارة بتبويبات (نظرة عامة، حسابات تجارية، موظفين، حجوزات)
- [x] إضافة إحصائيات متقدمة (إجمالي الإيرادات، عدد الحجوزات، العمولات)
- [x] إضافة بطاقات تنقل سريعة للحسابات التجارية والموظفين في لوحة الإدارة

## نظام الحسابات التجارية
- [x] إنشاء schema قاعدة بيانات للحسابات التجارية (اسم الشركة، جهة الاتصال، النسبة المئوية)
- [x] إنشاء tRPC routes لإدارة الحسابات التجارية (إنشاء، تعديل، حذف، قراءة)
- [x] إضافة شاشة إنشاء حساب تجاري في لوحة الإدارة
- [x] إضافة قائمة الحسابات التجارية مع إمكانية تعديل النسبة المئوية
- [x] إضافة حقول الحد الائتماني والرصيد الحالي والحالة
- [ ] تطبيق النسبة المئوية على أسعار الحجوزات للحسابات التجارية (مستقبلي)

## نظام إدارة الموظفين
- [x] إنشاء schema قاعدة بيانات للموظفين (اسم، بريد، دور، صلاحيات)
- [x] إنشاء tRPC routes لإدارة الموظفين (إنشاء، تعديل، حذف، قراءة، تسجيل دخول)
- [x] إضافة شاشة إنشاء حساب موظف في لوحة الإدارة
- [x] تحديد الأدوار والصلاحيات (مدير، محاسب، وكيل حجوزات، دعم)
- [x] إضافة قائمة الموظفين مع إمكانية تعديل الصلاحيات
- [x] إضافة نظام صلاحيات تفصيلي (7 صلاحيات مختلفة)
- [x] إضافة تشفير كلمات المرور (SHA-256)
- [x] إضافة تسجيل دخول الموظفين

## تحديث بيانات السفر لتتوافق مع Duffel
- [x] تحديث FlightOffer type لتشمل passengerPricing من Duffel
- [x] إضافة airlineCode إلى Flight type والبيانات الوهمية
- [x] تحديث Flight.class لقبول أي string من Duffel
- [x] تحديث explore.tsx لاستخدام تواريخ ديناميكية بدلاً من ثابتة
- [x] تحديث results.tsx لاستخدام Duffel API أولاً مع fallback للبيانات الوهمية
- [ ] إزالة البيانات الوهمية بالكامل واستبدالها ببيانات Duffel (مستقبلي)

## إزالة PNR الوهمي واستخدام رقم تعريف حقيقي من Duffel
- [x] إزالة توليد PNR الوهمي (RV-FL-XXXXXX) من payment.tsx
- [x] استخدام booking_reference الحقيقي من Duffel API كـ PNR
- [x] عرض رقم التأكيد الحقيقي من شركة الطيران في شاشة التأكيد
- [x] تحديث شاشة حالة الحجز لعرض PNR الحقيقي

## خيار حجز مؤكد 24 ساعة
- [x] إضافة خيار "حجز مؤكد 24 ساعة" في شاشة الدفع
- [x] استخدام Duffel createHoldOrder مع مهلة 24 ساعة
- [x] عرض مؤقت العد التنازلي لمهلة الدفع
- [x] إخبار Duffel بتنفيذ حجز مؤكد عبر createFlightOrder

## تطبيق العمولة التجارية على الحجوزات
- [x] ربط الحساب التجاري بالحجز
- [x] تطبيق النسبة المئوية للعمولة على سعر الحجز
- [x] عرض سطر العمولة التجارية في ملخص الدفع

## شاشة تسجيل دخول الموظفين
- [x] إنشاء شاشة تسجيل دخول منفصلة للموظفين
- [x] عرض لوحة تحكم مخصصة حسب صلاحيات الموظف
- [x] تقييد الوصول حسب الدور والصلاحيات

## تقارير مالية
- [x] إنشاء شاشة تقارير مالية في لوحة الإدارة
- [x] تقرير الإيرادات الشهرية
- [x] تقرير العمولات لكل حساب تجاري
- [x] تقرير الحجوزات حسب الحالة

## إرسال بريد تأكيد الدفع
- [x] إنشاء قالب HTML لبريد تأكيد الدفع في server/email.ts (موجود مسبقاً)
- [x] إضافة route tRPC لإرسال بريد تأكيد الدفع (موجود مسبقاً)
- [x] استدعاء إرسال البريد من confirm-payment.tsx عند تأكيد الدفع (موجود مسبقاً)
- [x] تضمين PNR الحقيقي وتفاصيل الحجز والمبلغ في البريد (موجود مسبقاً)

## تصدير التقارير المالية
- [x] إضافة زر تصدير PDF في شاشة التقارير المالية
- [x] إضافة زر تصدير Excel/CSV في شاشة التقارير المالية
- [x] إنشاء ملف التقرير وتحميله

## إشعارات انتهاء مهلة الـ 24 ساعة
- [x] إرسال إشعار push للعميل قبل انتهاء المهلة (6 ساعات، 2 ساعة، عند الانتهاء)
- [x] إرسال إشعار للمدير عند اقتراب انتهاء المهلة (ساعة قبل)
- [ ] إلغاء الحجز تلقائياً عند انتهاء المهلة (مستقبلي - يتطلب خادم خلفي)

## تبديل بيانات تسجيل دخول الإدارة
- [x] تغيير email الإدارة إلى suporte@royalvoyage.online
- [x] تحديث نظام المصادقة لاستخدام email/password بدلاً من PIN فقط

## إضافة خيار تغيير كلمة المرور
- [x] إضافة نافذة تغيير كلمة المرور في إعدادات الأمان
- [x] التحقق من كلمة المرور الحالية قبل التغيير
- [x] تحديث كلمة المرور في AsyncStorage

## التحقق الثنائي (2FA)
- [x] إنشاء نظام 2FA محلي (TOTP-like) مع مفتاح سري
- [x] إضافة شاشة إدخال رمز التحقق المكون من 6 أرقام
- [x] تخزين حالة 2FA والمفتاح السري في AsyncStorage
- [x] تفعيل/تعطيل 2FA من إعدادات الأمان في لوحة الإدارة
- [x] التحقق من الرمز عند تسجيل دخول الإدارة

## إصلاح PNR في حجز 24 ساعة
- [x] إصلاح حجز 24 ساعة ليعرض PNR حقيقي من Duffel بدلاً من PENDING
- [x] إزالة رقم المرجع الوهمي (RV-FL-XXXXXX) واستخدام booking_reference من Duffel
- [x] تحديث شاشة التأكيد لعرض الحالة الصحيحة (مؤكد/في الانتظار)
- [x] إضافة fallback لحجز فوري مؤكد عند فشل Hold API

## شاشة تتبع حالة الحجز
- [x] إضافة دالة getOrderStatus في duffel.ts
- [x] إضافة route tRPC لجلب حالة الحجز
- [x] إنشاء شاشة تتبع حالة الحجز مع تحديثات مباشرة
- [x] عرض تفاصيل الحجز والحالة (مؤكد، ملغي، في الانتظار)
- [x] ترجمة شاشة حالة الحجز إلى العربية
## إشعار بريدي عند تأكيد Hold
- [x] إضافة قالب بريد تأكيد Hold في email.ts
- [x] إرسال بريد تلقائي عند تحويل Hold إلى مؤكد في confirm-payment.tsx
- [x] إضافة route tRPC لإرسال بريد تأكيد Hold مع Push notification

## إلغاء الحجز عبر Duffel API
- [x] إضافة دالة cancelOrder في duffel.ts
- [x] إضافة route tRPC لإلغاء الحجز
- [x] إضافة زر إلغاء الحجز في لوحة الإدارة (booking-detail.tsx)
- [x] إرسال إشعار بريدي عند إلغاء الحجز
- [x] إضافة قالب بريد إلغاء الحجز في email.ts
- [x] إضافة route tRPC لإرسال بريد الإلغاء مع Push notification
- [x] إلغاء الحجز من شاشة pnr-status مع إرسال بريد تلقائي للعميل

## إصلاح توقف البحث عند انتهاء رصيد Manus
- [x] تشخيص سبب توقف البحث عن الرحلات عند انتهاء رصيد Manus
- [x] التأكد من أن الخادم (tRPC + Duffel API) يعمل بشكل مستقل عن sandbox Manus
- [x] تم التأكد: الخادم المنشور يعمل بشكل مستقل والمشكلة كانت في استخدام Expo Go

## إصلاح Hold Order يفشل دائماً بخطأ OFFER_UNAVAILABLE
- [x] تشخيص: holdFlightOrder كان يفحص (priced as any).available الذي لا يوجد أبداً
- [x] إصلاح الفحص ليتحقق من priced.pricedOffer بدلاً من available
- [x] تشخيص: Hold Orders غير مصرح بها في حساب Duffel Live + رصيد المحفظة غير كافٍ للحجز الفوري

## إصلاح crash التطبيق المنشور (APK)
- [x] نشر تحديث مع إصلاح Hold Order

## إضافة دعم Duffel Webhooks
- [x] البحث عن توثيق Duffel Webhooks وفهم الأحداث المدعومة (17 نوع حدث)
- [x] إنشاء endpoint لاستقبال Webhooks على الخادم (/api/webhooks/duffel) مع التحقق من التوقيع (HMAC-SHA256)
- [x] معالجة أحداث: order.created, order.creation_failed, airline_initiated_change, air.order.changed, order_cancellation.created/confirmed, payment events
- [x] إضافة إشعارات للوحة الإدارة عند كل حدث (مع تمييز الأحداث العاجلة)
- [x] حماية من التكرار (idempotency check) مع سجل أحداث (آخر 200 حدث)
- [x] إضافة routes tRPC لإدارة Webhooks (تسجيل، حذف، قائمة، ping، سجل الأحداث، إشعارات)
- [x] اختبار ناجح: ping, order.created, airline_change, cancellation, idempotency

## شاشة Webhooks في لوحة الإدارة
- [x] إنشاء شاشة admin/webhooks.tsx لعرض سجل الأحداث والإشعارات
- [x] عرض قائمة Webhooks المسجلة مع إمكانية الحذف والـ Ping
- [x] عرض سجل الأحداث المستلمة مع تفاصيل كل حدث
- [x] عرض الإشعارات العاجلة بشكل مميز
- [x] إضافة زر تسجيل Webhook جديد مع modal URL

## بريد تلقائي عند تغيير شركة الطيران
- [x] إنشاء جدول booking_contacts في قاعدة البيانات لربط Duffel order IDs ببيانات العملاء
- [x] تسجيل بيانات العميل تلقائياً عند كل حجز ناجح (bookFlightWithPNR + holdFlightOrder + client)
- [x] ربط حدث airline_initiated_change بإرسال بريد PNR Update تلقائي للعميل
- [x] ربط حدث order_cancellation.confirmed بإرسال بريد إلغاء تلقائي للعميل
- [x] إضافة route registerBookingContact لتسجيل بيانات العميل من التطبيق

## تحسين رسائل الخطأ عند فشل الحجز
- [x] عرض رسالة Alert واضحة عند عدم كفاية رصيد محفظة Duffel (insufficient balance)
- [x] عرض log واضح عند عدم دعم Hold Orders في الحساب
- [x] تحسين تجربة المستخدم: الحجز يُحفظ ويؤكد لاحقاً من قبل الإدارة بدلاً من الفشل الصامت

## إصلاح عرض مسار الرحلة في بطاقات نتائج البحث
- [x] إزالة كلمات International/Airport من أسماء المطارات لتقليصها
- [x] إضافة maxWidth: 110 و numberOfLines=1 و ellipsizeMode لمنع التداخل
- [x] تصغير خط اسم المدينة إلى 10px للتناسب مع المساحة

## إصلاح أمان لوحة الإدارة
- [x] إنشاء admin/_layout.tsx مع بوابة مصادقة إلزامية - لا يمكن الوصول لأي شاشة إدارة بدون تسجيل دخول
- [x] التحقق الصحيح من PIN وكلمة المرور قبل السماح بالدخول
- [x] قفل بعد 3 محاولات فاشلة لمدة 5 دقائق
- [x] دعم المصادقة البيومترية (بصمة/وجه) و 2FA
- [x] شاشة تسجيل دخول مستقلة بوضعين: بريد/كلمة مرور أو PIN

## إضافة شعارات شركات الطيران ✅
- [x] عرض شعار شركة الطيران بجانب اسمها في بطاقة الرحلة بدلاً من أيقونة الطائرة العامة
- [x] استخدام IATA code للحصول على الشعار من Kiwi.com CDN (images.kiwi.com/airlines/64/{code}.png)
- [x] تمرير airlineCode من نتائج البحث إلى شاشة التفاصيل

## إضافة فلتر السعر (slider) ✅
- [x] إضافة slider لتحديد نطاق سعري في نتائج البحث
- [x] فلترة النتائج حسب النطاق السعري المحدد
- [x] أزرار نطاقات سعرية مسبقة (500, 1000, 2000, 5000 MRU)

## تسجيل خروج تلقائي من لوحة الإدارة بعد عدم النشاط ✅
- [x] تسجيل خروج تلقائي بعد 10 دقائق من عدم النشاط
- [x] عرض تحذير قبل 60 ثانية من تسجيل الخروج مع عداد تنازلي
- [x] خيار تمديد الجلسة أو تسجيل الخروج فوراً
- [x] إعادة ضبط المؤقت عند أي تفاعل (لمس/ضغط)

## سجل محاولات الدخول للوحة الإدارة ✅
- [x] إنشاء lib/admin-login-audit.ts لحفظ سجل محاولات الدخول في AsyncStorage
- [x] تسجيل كل محاولة دخول (ناجحة/فاشلة) مع التاريخ والوقت ونوع المصادقة
- [x] إنشاء شاشة admin/login-audit.tsx لعرض سجل الدخول مع إحصائيات
- [x] إضافة رابط سجل الدخول في لوحة الإدارة
- [x] تسجيل من كلا نقطتي الدخول (profile.tsx + admin/_layout.tsx)

## تغيير بيانات الاعتماد من داخل لوحة الإدارة ✅
- [x] إنشاء شاشة admin/credentials.tsx لتغيير PIN والبريد وكلمة المرور
- [x] التحقق من بيانات الاعتماد الحالية قبل السماح بالتغيير
- [x] حفظ البيانات الجديدة في AsyncStorage
- [x] عرض رسالة تأكيد بعد التغيير الناجح
- [x] نصائح أمنية في الشاشة

## إصلاح بحث Duffel: بيروت - إسطنبول 4 أبريل ✅
- [x] تشخيص: Duffel API لا يدعم البحث بالعربية — المستخدم كتب "بيروت" و"اسطمبول" فلم تظهر اقتراحات
- [x] إضافة قاموس ترجمة عربي/فرنسي → إنجليزي (90+ مدينة) في searchLocations
- [x] دعم البحث بالعربية: بيروت، اسطنبول، اسطمبول، دبي، القاهرة، نواكشوط...
- [x] دعم البحث بالفرنسية: Beyrouth, Le Caire, Djeddah, Moscou, Pékin...

## إزالة نظام PIN والدخول مباشرة للوحة الإدارة ✅
- [x] إزالة شاشة المصادقة من admin/_layout.tsx والدخول مباشرة
- [x] إزالة PIN من admin/credentials.tsx
- [x] إزالة مودال PIN من profile.tsx
- [x] تنظيف admin/index.tsx من مراجع PIN
- [x] إزالة getAdminPin/setAdminPin/validatePin من lib/admin-security.ts
- [x] تحديث login-audit.tsx لإزالة تسمية PIN

## إصلاح مشكلة الدخول للوحة الإدارة ✅
- [x] توحيد بيانات الاعتماد بين app-context.tsx و admin-security.ts
- [x] ربط login بـ getAdminEmail/getAdminPassword لدعم تغيير كلمة المرور
- [x] البريد: suporte@royalvoyage.online / كلمة المرور: RoyalVoyage2024!

## تأكيد الدفع وإصدار التذاكر من لوحة الإدارة ✅
- [x] إضافة زر "تأكيد الدفع وإصدار التذكرة" في admin/booking-detail.tsx
- [x] استدعاء payHoldOrder عبر Duffel لتأكيد الدفع وإصدار التذكرة
- [x] تحديث حالة الحجز محلياً بعد التأكيد (PNR + رقم التذكرة + حالة confirmed)
- [x] إرسال تذكرة PDF + push للعميل بعد الإصدار
- [x] عرض حالة التأكيد (نجاح/فشل/رصيد غير كافٍ/حجز ملغى)
- [x] حوار تأكيد قبل التنفيذ مع ملخص الحجز

## إصلاح إشعارات لوحة الإدارة - شاشة الإشعارات فارغة ✅
- [x] تشخيص: AsyncStorage محلي لكل جهاز — الإشعارات تُحفظ على جهاز العميل وليس المدير
- [x] إنشاء lib/admin-notification-sync.ts لمزامنة الحجوزات → إشعارات
- [x] تحديث admin/notifications.tsx لمزامنة الحجوزات عند فتح الشاشة
- [x] إضافة عدد الإشعارات غير المقروءة في admin/index.tsx
- [x] 6 اختبارات ناجحة

## ربط Stripe API للدفع الإلكتروني وإزالة PayPal
- [x] تثبيت stripe في الخادم و @stripe/stripe-react-native في الواجهة
- [x] إعداد STRIPE_SECRET_KEY و STRIPE_PUBLISHABLE_KEY
- [x] إنشاء route tRPC لإنشاء PaymentIntent
- [x] إضافة Stripe كطريقة دفع في شاشة الدفع (Visa/Mastercard)
- [x] معالجة الدفع عبر Stripe وتأكيد الحجز بعد النجاح
- [x] إزالة PayPal من قائمة طرق الدفع
- [x] إضافة StripeProvider في _layout.tsx
- [x] تنفيذ Stripe Payment Sheet للدفع بالبطاقة
- [x] تحديث شاشات الإدارة (confirm-payment, booking-detail, profit-report, financial-reports)
- [x] تحديث صفحة طرق الدفع في الملف الشخصي
- [x] تحديث admin-notification-sync.ts بليبل Stripe
- [x] إنشاء platform-specific wrappers (stripe-provider.web.tsx, stripe-provider.native.tsx)
- [x] إنشاء platform-specific hooks (use-stripe-payment.web.ts, use-stripe-payment.native.ts)
- [x] إصلاح Metro web bundling error لـ @stripe/stripe-react-native
- [x] إضافة stripePaymentIntentId في Booking type
- [x] كتابة وتشغيل اختبارات Stripe integration

## نظام شحن رصيد الحسابات التجارية
- [x] إنشاء جدول top_up_requests في قاعدة البيانات
- [x] إنشاء جدول balance_transactions لسجل المعاملات
- [x] إضافة دوال DB (createTopUpRequest, approveTopUpRequest, rejectTopUpRequest, getBalanceTransactions, deductBalance)
- [x] إضافة tRPC routes (topUp.list, topUp.create, topUp.approve, topUp.reject, balanceTransactions.list)
- [x] إنشاء شاشة إدارة رصيد الحساب (account-balance.tsx) - عرض الرصيد + طلبات الشحن + سجل المعاملات
- [x] إنشاء شاشة طلبات شحن الرصيد للإدارة (topup-requests.tsx) - عرض كل الطلبات + موافقة/رفض
- [x] تحديث بطاقة الحساب التجاري لعرض الرصيد الحالي وزر إدارة الرصيد
- [x] إضافة بطاقة طلبات شحن الرصيد في لوحة الإدارة الرئيسية

## إصلاح عرض الأسعار في نتائج البحث
- [x] عرض السعر الإجمالي (سعر Duffel + نسبة الهامش المحددة من الإدارة) في نتائج البحث
- [x] إخفاء الرسوم الإضافية عن العميل ودمجها مع السعر الأصلي
- [x] إضافة حقل markupPercent و markupPercentDomestic في PricingSettings
- [x] إضافة قسم نسبة الهامش في شاشة إدارة الأسعار
- [x] تطبيق applyMarkup في نتائج البحث وشاشة التفاصيل

## نسبة هامش حسب الدرجة + تقرير مقارنة الأسعار
- [x] إضافة نسبة هامش مختلفة حسب الدرجة (اقتصادي/أعمال/أولى) في PricingSettings
- [x] تحيث شاشة إدارة الأسعار لعرض حقول الهامش حسب الدرجة
- [x] تحديث applyMarkup لقبول درجة الرحلة وتطبيق النسبة المناسبة
- [x] تطبيق الهامش حسب الدرجة في نتائج البحث وشاشة التفاصيل
- [x] إنشاء شاشة تقرير مقارنة الأسعار في لوحة الإدارة (سعر Duffel الأصلي vs السعر المعروض + هامش الربح)
- [x] إضافة رابط تقرير مقارنة الأسعار في لوحة الإدارة الرئيسية

## إصلاح تغير السعر
- [x] تتبع مسار السعر من نتائج البحث إلى التفاصيل إلى الدفع وإصلاح التناقض
- [x] إضافة agencyFee في results.tsx لتوحيد حساب السعر مع detail.tsx
- [x] إصلاح خطأ Cannot access getFlightTotalMRU before initialization - نقل تعريف الدالة قبل أول استخدام

## تحسينات عرض الأسعار
- [x] عرض سعر الشخص الواحد في بطاقة نتائج البحث بجانب السعر الإجمالي
- [x] شارة "أفضل سعر" على الرحلات الأرخص في نتائج البحث
- [x] مقارنة أسعار بين الدرجات (اقتصادي/أعمال/أولى) في شاشة التفاصيل

## اختبار وتحسين + فلتر الدرجة + النشر
- [x] التحقق من عرض الأسعار بشكل صحيح مع شارة أفضل سعر وسعر الشخص الواحد
- [x] إضافة فلتر حسب الدرجة (اقتصادي/أعمال/أولى) في نتائج البحث (موجود مسبقاً)
- [x] تجهيز التطبيق للنشر

## سعر الأطفال وتاريخ الميلاد
- [ ] عرض سعر الأطفال منفصلاً عن سعر البالغين في نتائج البحث وشاشة التفاصيل
- [ ] عرض سعر الرضع منفصلاً إن وجد
- [ ] إضافة حقل تاريخ ميلاد الطفل في نموذج بيانات المسافرين
- [ ] التحقق من أن Duffel API يرجع أسعار مختلفة حسب نوع المسافر (adult/child/infant)

## تسعير الأطفال مع تاريخ الميلاد
- [x] إضافة حقول تاريخ ميلاد الأطفال في نموذج البحث (Home) - DatePicker لكل طفل
- [x] تمرير أعمار/تواريخ ميلاد الأطفال من البحث إلى نتائج الرحلات
- [x] تحديث Duffel API لتمرير أعمار الأطفال الحقيقية بدلاً من العمر الثابت (10)
- [x] إضافة نموذج بيانات لكل طفل في شاشة passenger-details (اسم + تاريخ ميلاد)
- [x] تمرير childDetailsJson عبر summary → payment → booking
- [x] تحديث routers.ts لقبول childDetails واستخدام تواريخ ميلاد حقيقية
- [x] عرض تفصيل أسعار الأطفال في شاشة التفاصيل والدفع

## إصلاح فشل النشر
- [x] تشخيص سبب فشل النشر (Publish)
- [x] إصلاح أخطاء البناء إن وجدت
- [x] إعادة النشر بنجاح

## تحسين الأداء والتوافق مع الهواتف
- [x] تحويل ScrollView+map إلى FlatList في شاشات النتائج
- [x] إضافة memo وuseMemo لمنع إعادة الرسم غير الضرورية
- [x] تحسين أحجام الخطوط والمسافات للهواتف الصغيرة
- [x] تحسين أداء شاشة Home - تقليل إعادة الرسم
- [x] إضافة useCallback للدوال المتكررة
- [x] تحسين أداء AppContext وI18nProvider بـ useMemo
- [x] تحسين FlatList في نتائج الرحلات (maxToRenderPerBatch, windowSize)
- [x] تحسين QueryClient بـ staleTime وgcTime للتخزين المؤقت
- [x] تحسين مكون LocationAutocomplete بـ React.memo
- [x] تحسين Tab Bar - تقليل الارتفاع وتحسين الحشو

## تحسينات Stripe
- [ ] تحديث STRIPE_SECRET_KEY بالمفتاح الصحيح
- [x] إضافة Stripe Webhook endpoint لتأكيد الدفع تلقائياً
- [x] تحديث حالة الحجز عند تأكيد الدفع من Stripe

## إشعارات الدفع والبريد الإلكتروني
- [x] إضافة Push notification للمدير عند كل دفع ناجح عبر Stripe
- [x] عرض سجل مدفوعات Stripe في لوحة الإدارة
- [x] إرسال إيميل تأكيد تلقائي للعميل بعد نجاح الدفع

## زر استرداد Stripe
- [x] إضافة endpoint /api/stripe-refund في الخادم
- [x] إضافة زر Refund في سجل Stripe في لوحة الإدارة مع تأكيد

## إصلاح حساب الإدارة
- [x] تحديث كلمة مرور الإدارة بكلمة مرور قوية
- [x] إنشاء شاشة تسجيل دخول مخصصة للإدارة تفتح مباشرة على واجهة الإدارة
- [x] تحديث long press في Profile ليفتح شاشة تسجيل دخول الإدارة

## Landing Page - royalvoyage.online
- [x] بناء Landing Page احترافية متجاوبة للكمبيوتر والجوال
- [x] إضافة قسم Hero مع CTA لتحميل التطبيق
- [x] إضافة قسم خصائص التطبيق
- [x] إضافة قسم الوجهات الشائعة
- [x] إضافة قسم الشهادات والتقييمات
- [x] إضافة قسم طرق الدفع والأمان
- [x] إضافة قسم FAQ
- [x] إضافة Footer مع روابط التواصل
- [x] SEO meta tags وOpen Graph
- [x] دعم اللغتين العربية والإنجليزية

## تحسينات Landing Page
- [x] ربط royalvoyage.online مباشرة بالـ Landing Page
- [x] إضافة صور حقيقية للوجهات السياحية
- [x] إضافة نموذج تواصل يرسل لـ suporte@royalvoyage.online

## Landing Page في Expo (ويب)
- [x] إنشاء صفحة app/landing.tsx في Expo Router
- [x] كشف المنصة وتوجيه الويب للـ Landing Page
- [x] نقل محتوى HTML Landing Page إلى مكونات React Native Web

## تحسينات Landing Page - الجولة الثانية
- [x] استبدال صور Unsplash بصور عالية الجودة من مصادر مختلفة
- [x] إضافة قسم "شركاؤنا" بشعارات شركات الطيران
- [ ] إضافة Google Analytics (مؤجل - يحتاج Measurement ID)

## إصلاح شعارات شركات الطيران
- [x] استبدال الإيموجي بصور شعارات رسمية حقيقية لكل شركة طيران

## نظام الحجز الكامل على الموقع
- [ ] صفحة بحث عن رحلات جوية على الويب (مطار، تاريخ، مسافرون، درجة)
- [ ] صفحة بحث عن فنادق على الويب (مدينة، تاريخ، غرف، ضيوف)
- [ ] صفحة نتائج البحث عن الرحلات
- [ ] صفحة نتائج البحث عن الفنادق
- [ ] صفحة تفاصيل الحجز وإدخال بيانات المسافرين
- [ ] ربط الدفع عبر Stripe من الموقع
- [ ] صفحة تأكيد الحجز وإرسال التذكرة

## إصلاح شعارات بطاقات الدفع في Landing Page
- [x] استبدال إيموجي Visa/Mastercard/Amex بشعارات حقيقية SVG

## تحسين قسم الدفع في Landing Page
- [x] إضافة شعار PayPal الرسمي في قسم الدفع
- [x] إضافة Bankily وSedad وMasrvi وطرق الدفع المحلية
- [x] تقسيم قسم الدفع إلى تبويبين (دولي / محلي)

## تقوية المنصة - الأولويات
- [x] إنشاء صفحة Privacy Policy (/privacy)
- [x] إنشاء صفحة Terms & Conditions (/terms)
- [x] إنشاء صفحة Refund Policy (/refund)
- [x] إنشاء صفحة Contact Us (/contact)
- [x] إضافة زر واتساب ثابت في Landing Page
- [x] إضافة بريد رسمي وعنوان الشركة ورقم الهاتف في Footer
- [x] إضافة sitemap.xml وrobots.txt
- [ ] تحسين meta tags وSEO في Landing Page
- [ ] فحص رحلة المستخدم الكاملة (بحث → نتائج → دفع → تأكيد)
- [ ] التحقق من ظهور الحجوزات في قسم Bookings بعد الدفع

## إصلاح البيانات الثابتة - أولوية عالية
- [ ] إزالة حالة Gold الثابتة من صفحة Profile - ربطها ببيانات المستخدم الحقيقية
- [ ] إزالة رقم الدعم الثابت من Profile - استبداله برقم حقيقي أو إخفاؤه
- [ ] إزالة إصدار التطبيق v1.0.0 الثابت من Profile
- [ ] إصلاح صفحة Bookings - عرض "لا توجد حجوزات" بشكل صحيح بدون أرقام وهمية
- [ ] إزالة الأسعار والوجهات والمقاعد الثابتة من الصفحة الرئيسية
- [ ] ربط "الوجهات الشائعة" ببيانات حقيقية أو إخفاؤها إن لم تكن متاحة

## إعادة تصميم لوحة الإدارة
- [ ] إعادة تصميم شاشة تسجيل دخول الأدمن بمظهر احترافي
- [ ] إعادة تصميم Dashboard الرئيسي للأدمن بمؤشرات KPI احترافية وتنظيم أفضل
- [x] استبدال emoji في admin/index.tsx (📈 و👨‍💼)
- [x] استبدال emoji في login-audit.tsx (✅ ❌ 📋)
- [x] استبدال emoji في credentials.tsx (💡)
- [x] استبدال emoji في employee-login.tsx (👨‍💼 🙈 👁️)

## تحسين لوحة الإدارة - ظهور جميع الأحداث
- [x] إضافة قسم معلومات check-in والمقعد والوجبة في booking-detail.tsx
- [x] إضافة عرض صورة إيصال الدفع في booking-detail.tsx
- [x] إضافة عرض رقم المرجع البنكي (transferRef) في booking-detail.tsx
- [x] إضافة عرض معلومات العمولة (businessAccount) في booking-detail.tsx
- [x] استبدال emoji في booking-detail.tsx بـ MaterialIcons
- [x] استبدال emoji في admin/index.tsx (📈 و👨‍💼 و✉️)
- [x] استبدال emoji في login-audit.tsx (✅ ❌ 📋)
- [x] استبدال emoji في credentials.tsx (💡)

## تحسينات لوحة الإدارة - الدفعة الثانية
- [ ] إعادة تصميم Dashboard الرئيسي بمؤشرات KPI احترافية (بطاقات ملونة، مقارنة شهرية)
- [ ] إضافة رسم بياني للإيرادات الشهرية في Dashboard
- [ ] إضافة رسم بياني لتوزيع الحجوزات (رحلات/فنادق) في Dashboard
- [x] إضافة فلتر متقدم في قائمة الحجوزات (حسب طريقة الدفع، المدينة، التاريخ)
- [x] إضافة إشعار فوري للمدير عند ورود حجز جديد
- [x] إضافة إشعار فوري للمدير عند رفع إيصال دفع

## إصلاح مشاكل الواجهة (من الصور)
- [x] إصلاح شاشة Flight Details - العنوان بالإنجليزية بدلاً من العربية
- [x] إصلاح شاشة Flight Details - المحتوى مقطوع (الوقت والمطارات)
- [x] إصلاح "للشخص" إلى "للشخص الواحد" في بطاقة السعر
- [x] إصلاح شاشة Profile - نصوص برتغالية ("هذا سلوك صحيح - المستخدم اختار البرتغالية")
- [x] إصلاح شاشة Contact Us - العنوان بالإنجليزية
- [x] إصلاح شاشة Contact Us - شعارات شركات الطيران لا تظهر

## شعارات طرق الدفع الموريتانية
- [ ] تنزيل الشعار الرسمي لـ Bankily
- [ ] تنزيل الشعار الرسمي لـ Masrvi (مصرفي)
- [ ] تنزيل الشعار الرسمي لـ Sedad
- [ ] تنزيل الشعار الرسمي لـ Stripe (الرسمي)
- [ ] إضافة الشعارات في شاشة الدفع بدلاً من النصوص
- [ ] إزالة جميع الـ emoji المتبقية في التطبيق

## رسوم حجز مؤكد 24 ساعة (قابلة للتعديل من الإدارة)
- [x] إضافة حقل hold24hFeeMRU في pricing-settings.ts
- [x] إضافة قسم "رسوم الاحتفاظ بالسعر" في admin/pricing.tsx
- [x] ربط شاشة الدفع بالرسوم الديناميكية من pricing-settings

## تكامل HBX Group API للفنادق
- [x] إنشاء ملف server/hbx.ts مع دوال البحث والحجز
- [x] إضافة مسارات HBX في server/routers.ts
- [x] اختبار الاتصال بـ HBX API (Test Environment يعمل بنجاح)
- [x] تحديث صفحة results.tsx لاستخدام HBX بدلاً من Duffel للفنادق
- [ ] تحديث صفحة detail.tsx لعرض تفاصيل فنادق HBX
- [x] إضافة خدمة CheckRate قبل الحجز
- [ ] إضافة خدمة Booking لتأكيد الحجز (تتطلب موافقة HBX Production)

## تطوير تبويب الأنشطة (Activities Tab Enhancement)
- [x] استبدال أزرار الوجهات الثابتة بحقل بحث نصي مع autocomplete في تبويب الأنشطة
- [x] إنشاء شاشة نتائج الأنشطة (activities/index.tsx) مع قائمة الأنشطة
- [x] إضافة فلاتر في شاشة نتائج الأنشطة (حسب الفئة: جولات، مغامرات، ثقافة، طبيعة، طعام)
- [x] إضافة فلتر نطاق السعر في شاشة نتائج الأنشطة (منخفض/متوسط/مرتفع)
- [x] تحديث شاشة تفاصيل النشاط (activities/[id].tsx) مع تحسينات التصميم
- [x] HBX Activities API متكامل بالفعل في server/hbx.ts (searchActivities + getActivityDetail)
- [x] tRPC routes موجودة بالفعل (hbxActivities.search + hbxActivities.detail)
- [ ] إنشاء شاشة حجز النشاط (activity-booking.tsx) مع نموذج بيانات المشاركين
- [ ] إضافة route tRPC لحجز النشاط (bookActivity) - يتطلب موافقة HBX Production

## تطوير نظام حجز الأنشطة وعرضها (Activity Booking & Display System)
- [x] إنشاء شاشة حجز النشاط (app/activities/booking.tsx) مع نموذج بيانات المشاركين
- [x] إضافة حقول: الاسم الكامل، الجنسية، تاريخ الميلاد، رقم الجواز لكل مشارك
- [x] إضافة ملخص الحجز مع السعر الإجمالي وشروط الإلغاء
- [x] ربط شاشة الحجز بزر "احجز هذا النشاط" في شاشة التفاصيل
- [x] إضافة الأنشطة المحجوزة في قسم "حجوزاتي" (app/(tabs)/bookings.tsx)
- [x] إنشاء بطاقة عرض خاصة بالأنشطة المحجوزة مع الحالة والتاريخ
- [x] إضافة قسم "الأنشطة الشعبية" في الصفحة الرئيسية (app/(tabs)/index.tsx)
- [x] عرض 4 أنشطة مميزة في شريط أفقي قابل للتمرير (Barcelona, Dubai, Paris, Palma)
- [x] تحديث نوع Booking لدعم "activity" في lib/mock-data.ts

## ربط HBX Activities API الحقيقي (Connect Real HBX Activities API)
- [x] حفظ مفتاح HBX_ACTIVITIES_API_KEY كمتغير بيئة
- [x] حفظ مفتاح HBX_ACTIVITIES_API_SECRET كمتغير بيئة
- [x] اختبار الاتصال بـ HBX Activities API - نجح (20 نشاط في برشلونة)
- [x] التحقق من عمل البحث الحقيقي للأنشطة - يعمل

## تحسينات نظام الأنشطة (Activities System Enhancements)
- [x] تفعيل بيئة الإنتاج HBX_USE_PRODUCTION=true
- [x] إضافة فلتر عدد الأطفال (0-12 سنة) في نموذج بحث الأنشطة
- [x] إضافة فلتر اللغة (عربي/فرنسي/إنجليزي/برتغالي) في نموذج بحث الأنشطة
- [x] تفعيل HBX Booking API في server/hbx.ts (دالة bookActivity)
- [x] إضافة route bookActivity في server/routers.ts (hbxActivities.book)
- [x] تحديث شاشة حجز النشاط لاستخدام HBX API الحقيقي مع fallback محلي
- [x] إضافة حالة تحميل وتعطيل زر الحجز أثناء الإرسال
- [x] إضافة قسم تقييمات العملاء في شاشة تفاصيل النشاط (3 تقييمات بالنجوم والتعليقات)

## تحسينات متقدمة للأنشطة (Advanced Activities Enhancements)
- [x] ربط اللغة المختارة بأوصاف الأنشطة في searchActivities (موجود بالفعل)
- [x] تمرير language param من شاشة البحث إلى شاشة نتائج الأنشطة
- [x] إضافة خريطة الموقع في شاشة تفاصيل النشاط باستخدام react-native-maps
- [x] إنشاء جدول activity_reviews في قاعدة البيانات
- [x] إضافة tRPC routes: activityReviews.list وactivityReviews.add
- [x] تحديث شاشة تفاصيل النشاط لعرض التقييمات الحقيقية من قاعدة البيانات
- [x] إضافة نموذج إضافة تقييم تفاعلي (نجوم + اسم + تعليق) في شاشة تفاصيل النشاط

## تحسينات UX للأنشطة (Activities UX Improvements)
- [x] إضافة معرض صور أفقي (3-5 صور) في شاشة تفاصيل النشاط مع FlatList وpagingEnabled
- [x] إضافة مؤشر نقاط للصور (dots indicator) في معرض الصور
- [x] إضافة فلتر "التقييم الأدنى" في شاشة نتائج الأنشطة (4+ نجوم، 3+ نجوم) بلون أصفر
- [x] إضافة زر مشاركة عبر WhatsApp (💬) وزر مشاركة عام في أعلى معرض الصور

## إصلاح خطأ بناء Android (Build Fix)
- [x] إصلاح ملف payment_bankily.png (كان JPEG بامتداد .png) - تحويل إلى PNG حقيقي
- [x] إصلاح ملف payment_masrvi.png (كان WebP بامتداد .png) - تحويل إلى PNG حقيقي
- [x] إصلاح ملف bankily_alt.png (كان HTML) - استبدال بنسخة صحيحة
- [x] التحقق من جميع ملفات PNG في assets/images - لا توجد مشاكل

## خاصية المفضلة للأنشطة (Activity Favorites)
- [x] إنشاء hooks/use-favorite-activities.ts لحفظ المفضلة بـ AsyncStorage
- [x] إضافة زر قلب (❤️/🤍) في بطاقة النشاط في شاشة النتائج
- [x] إضافة زر قلب في شاشة تفاصيل النشاط بجانب أزرار المشاركة
- [x] إنشاء شاشة المفضلة app/activities/favorites.tsx مع شاشة فارغة جميلة
- [x] إضافة زر قلب في أعلى يمين شاشة النتائج للانتقال إلى شاشة المفضلة

## نظام إشعارات الحجز (Booking Notifications - 24h Reminder)
- [x] إضافة scheduleBookingReminder24h إلى lib/push-notifications.ts مع طلب الأذونات
- [x] إضافة setupNotificationChannel لقناة Android "bookings" واستدعاؤها في _layout.tsx
- [x] دمج إشعار التذكير 24ساعة + فوري في شاشة تأكيد حجز الرحلات (booking/confirmation.tsx)
- [x] دمج إشعار التذكير 24ساعة + فوري في شاشة تأكيد حجز الفنادق (booking/confirmation.tsx)
- [x] دمج إشعار التذكير 24ساعة + فوري في شاشة حجز الأنشطة (activities/booking.tsx)
- [x] إضافة إشعار فوري عند تأكيد الحجز (رحلات + فنادق + أنشطة)
- [x] دعم اللغات الأربع (ar/fr/en/pt) في نصوص الإشعارات
- [x] كتابة 19 اختبار vitest واجتيازها بنجاح

## إصلاحات الإنتاج (Production Fixes)
- [x] إزالة router amadeus من server/routers.ts واستبداله بـ duffel
- [x] إزالة ملفات scripts/check-office-id*.ts و scripts/verify-amadeus-env.ts
- [x] إزالة types/amadeus.d.ts
- [x] إصلاح جميع trpc.amadeus -> trpc.duffel في كل ملفات العميل (9 ملفات)
- [x] إصلاح 127.0.0.1 في admin/booking-detail.tsx باستخدام getApiBaseUrl()
- [x] إصلاح 127.0.0.1 في hooks/use-ticket-polling.ts باستخدام getApiBaseUrl()
- [x] إصلاح Deep Linking scheme من manus20260323015034 إلى royalvoyage في server/_core/index.ts
- [x] إصلاح placeholder your-server.com في admin/webhooks.tsx
- [x] الميكروفون مستخدم فعلياً في البحث الصوتي - تم الإبقاء عليه

## صفحات الثقة (Trust Pages)
- [ ] إنشاء app/legal/about.tsx — من نحن
- [ ] إنشاء app/legal/privacy.tsx — سياسة الخصوصية
- [ ] إنشاء app/legal/terms.tsx — الشروط والأحكام
- [ ] إنشاء app/legal/contact.tsx — اتصل بنا
- [ ] إنشاء app/legal/cancellation.tsx — سياسة الإلغاء والاسترداد
- [ ] إنشاء app/legal/_layout.tsx — layout للصفحات القانونية
- [ ] تحديث Footer (app/(tabs)/index.tsx أو component) لإظهار روابط الصفحات
- [ ] تحديث صفحة Profile لإضافة قسم "قانوني" مع روابط الصفحات
- [x] إضافة خيار التواريخ المرنة (±3 أيام) في نموذج البحث

- [x] تغيير كلمة المرور الافتراضية للأدمن (من RV@Admin#2026$Secure! إلى RV@2026#Voyage$!)
- [x] تحسين CORS بإضافة قائمة بيضاء للـ origins المسموح بها
- [x] حذف مراجع manus المرئية للمستخدم
- [x] التحقق من عدم وجود مفاتيح API مكشوفة في الكود
- [ ] ضبط متغيرات SMTP (EMAIL_USER, EMAIL_PASS) للبريد الإلكتروني
- [ ] إضافة جدول سجل الدخول في قاعدة البيانات وعرضه في الأدمن
- [ ] تقسيم شاشة الأدمن إلى مكوّنات منفصلة لتحسين الأداء
- [x] إعداد SMTP Gmail لإرسال البريد الإلكتروني
- [x] إصلاح تنسيق نموذج البحث على الهاتف (التواريخ والمسافرون)
- [x] إشعار Push للأدمن عند وصول حجز جديد
- [x] Limpeza de produção: allowBackup=false via plugin withAndroidManifest
- [x] Limpeza de produção: remover permissões desnecessárias (SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE, MODIFY_AUDIO_SETTINGS)
- [x] Limpeza de produção: remover domínio sandbox manus.space do CORS
- [x] Limpeza de produção: remover senha hardcoded do bundle do cliente
- [x] Limpeza de produção: bundle ID com.royalvoyage.app e scheme royalvoyage confirmados
- [x] Limpeza de produção: TypeScript 0 erros confirmado
- [x] Limpeza de produção: auditoria final passou (0 issues críticos/altos)
- [x] إزالة نظام الإدارة الكامل من تطبيق العملاء (app/admin، lib/admin-*، مراجع isAdmin)

## دمج تطبيق Admin في المشروع الرئيسي
- [x] نسخ شاشات Admin (dashboard, bookings, employees, reports, partners, settings) إلى app/admin/
- [x] نسخ ملفات lib (admin-context, admin-security) إلى lib/
- [x] إضافة bookingContacts router في routers.ts
- [x] إضافة appSettings router في routers.ts
- [x] إضافة getAllBookingContacts و updateBookingContactPnrById في db.ts
- [x] إضافة شاشة إدارة الشركاء (partners.tsx)
- [x] إضافة تصدير التقارير إلى Excel في reports.tsx
- [x] إصلاح أخطاء TypeScript في ملفات Admin

## تحسينات شاشة الشركاء
- [x] إضافة حقل بحث في قائمة الشركاء للبحث بالاسم أو البريد الإلكتروني أو رقم الهاتف

## تحسينات شاشة الشركاء (المرحلة 2)
- [x] إضافة أزرار تصفية حسب الحالة (الكل / نشط / موقوف / مغلق)
- [x] إنشاء شاشة تفاصيل الشريك مع سجل الحجوزات وكشف الحساب
- [ ] ربط نطاق royalvoyage.online بالتطبيق
- [x] إظهار زر الإدارة في التطبيق الرئيسي لحساب الأدمين فقط (مخفي عن المستخدمين العاديين)

## تحسين التصميم للشاشات الكبيرة
- [x] تحسين الشاشة الرئيسية (Home) لتناسب شاشات tablet وdesktop
- [ ] تحسين شاشة البحث عن الرحلات للشاشات الكبيرة
- [ ] تحسين شاشة الاستكشاف (Explore) للشاشات الكبيرة
- [ ] تحسين شاشة الحجوزات (Bookings) للشاشات الكبيرة
- [ ] تحسين شاشة الملف الشخصي (Profile) للشاشات الكبيرة
- [x] إضافة sidebar navigation للشاشات الكبيرة بدلاً من tab bar السفلي

## تحسينات صفحة Landing
- [x] إضافة قسم "وجهات شعبية" بصور جذابة في صفحة landing
- [x] تحسين نموذج البحث ليكون أفقياً على desktop مثل Kayak
- [x] إضافة قسم "عروض اليوم" برحلات بأسعار مخفضة

## تحسينات إضافية على صفحة Landing (الدورة الثانية)
- [x] إضافة قسم "شهادات العملاء" بتقييمات ونجوم
- [x] تحسين بطاقات الوجهات لتكون أكبر على الموبايل (240px)
- [x] ربط زر "احجز الآن" في عروض اليوم بنموذج البحث مباشرةً

## نافذة منبثقة للعروض
- [x] إضافة popup يظهر للزائر عند أول دخول بعرض خصم 10% مع حقل البريد الإلكتروني

## تحسينات الدورة الرابعة
- [x] إضافة شريط إحصائيات (500+ شركة طيران، 50000+ رحلة، 4.8 تقييم) في صفحة landing
- [x] تحسين صفحة "من نحن" بقصة الشركة وقيم العلامة التجارية وصورة الفريق

## إصلاح الموقع المنشور
- [x] إصلاح مسار landing.html في الخادم (كان يبحث في dist/ بدلاً من web-dist/)
- [x] إضافة royalvoyage-dcsedylm.manus.space إلى CORS المسموح بها
- [x] إضافة نمط manus.space إلى ALLOWED_ORIGIN_PATTERNS

## Google Analytics
- [x] إضافة Google Analytics (G-L9C4EJXPG6) إلى الموقع

## Sezione Feedback Clienti
- [ ] Modulo feedback con valutazione a stelle (1-5) e commento nella landing page
- [ ] Backend tRPC route per salvare i feedback nel database PostgreSQL
- [ ] Visualizzazione recensioni dinamiche dalla DB nella landing page (sostituisce dati mock)
- [x] Sezione feedback clienti con modulo valutazioni a stelle (DB + tRPC + UI nella landing page)
- [ ] بحث الرحلات متعددة المدن (Multi-city flight search)
- [ ] استبدال HBX بـ Amadeus Hotel Search API لبحث الفنادق
- [x] دمج Amadeus API مع Duffel لبحث وحجز الطيران (Amadeus للبحث + Duffel للحجز)
- [ ] تفعيل AMADEUS_OFFICE_ID لإصدار التذاكر عبر Amadeus مباشرة
- [ ] تفعيل Amadeus Hotel APIs (Hotel Search + Hotel Offers)
- [ ] اختبار حجز حقيقي NKC→CDG والتحقق من PNR

- [x] عرض شعار الشريك في صفحة التفاصيل (partner-detail) بدلاً من الحرف الأول
- [x] إضافة تصفية الموظفين حسب الدور في لوحة إدارة الموظفين مع تحديد صلاحيات كل دور
- [x] إضافة سجل النشاط لتتبع عمليات الموظفين (إضافة/تعديل/حذف) في لوحة الإدارة
- [x] إضافة حقول إدخال يدوية لأسعار الصرف في لوحة الإدارة (USD, EUR, GBP, SAR, AED, AOA)

- [x] إضافة زر إلغاء الحجز من Amadeus في صفحة تفاصيل الحجز
- [x] إضافة التحقق من حالة التذكرة في صفحة تفاصيل الحجز
- [x] إضافة زر إرسال التذكرة للعميل من صفحة تفاصيل الحجز
- [x] إضافة تنبيه تلقائي للمدير عند كل حجز جديد مع PNR وبيانات المسافر
- [x] إضافة endpoint cancelAndDelete في bookingContacts router

- [ ] إرسال كلمة السر لبريد الموظف عند إنشاء حسابه
- [ ] إضافة فلتر حجوزات اليوم في صفحة الحجوزات
- [ ] تصدير قائمة الحجوزات كملف CSV

- [x] إرسال كلمة السر لبريد الموظف عند إنشاء حسابه
- [x] إضافة فلتر حجوزات اليوم في صفحة الحجوزات
- [x] تصدير قائمة الحجوزات كملف CSV

- [ ] إضافة زر تأكيد الدفع في صفحة تفاصيل الحجز
- [ ] إرسال بريد تأكيد الدفع للعميل تلقائياً عند تأكيد الدفع من لوحة الإدارة
- [ ] إضافة حقل paymentStatus في جدول bookingContacts

- [x] إضافة زر تأكيد الدفع في صفحة تفاصيل الحجز
- [x] إرسال بريد تأكيد الدفع للعميل تلقائياً عند تأكيد الدفع من لوحة الإدارة
- [x] إضافة حقل paymentStatus في جدول bookingContacts

- [ ] إضافة فلتر حالة الدفع (مدفوع/في الانتظار/مرفوض) في صفحة الحجوزات
- [ ] تحديث بطاقات الحجز لعرض حالة الدفع
- [ ] إضافة endpoint rejectPayment في backend مع إرسال بريد الرفض للعميل
- [ ] إضافة زر رفض الدفع في صفحة تفاصيل الحجز مع حقل سبب الرفض

- [x] إضافة فلتر حالة الدفع (مدفوع/في الانتظار/مرفوض) في صفحة الحجوزات
- [x] إضافة زر رفض الدفع مع حقل سبب الرفض في صفحة تفاصيل الحجز
- [x] إرسال بريد إلكتروني للعميل عند رفض الدفع مع سبب الرفض

## تحسينات مطلوبة — أبريل 2026
- [x] اختبار حجز حقيقي بمسافر تجريبي على Amadeus Production (dry-run test)
- [x] إضافة شاشة تتبع حالة التذكرة (Queued → Ticketed → Issued) مع إشعار تلقائي
- [x] إصلاح عرض سعر الأطفال بشكل منفصل في بطاقة الرحلة ونتائج البحث
- [ ] إضافة تفاصيل السعر (ضرائب + رسوم + سعر أساسي) في صفحة تفاصيل الرحلة
- [ ] إضافة حقل ملاحظات اختياري في صفحة بيانات المسافر وتمريره للحجز
