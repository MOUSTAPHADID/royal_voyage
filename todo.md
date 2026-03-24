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
