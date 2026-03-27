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
- [x] إضافة زر "العودة إلى Royal Voyage" بـ deep link + زر "إغلاق الصفحة"

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
