import { ScrollView, Text, View, Pressable, Linking, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type Lang = "ar" | "en" | "fr";

const CONTENT: Record<Lang, {
  dir: "rtl" | "ltr";
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; body: string }[];
  tableTitle: string;
  table: { when: string; fee: string; note: string }[];
  tableHeaders: { when: string; fee: string; note: string };
  contactTitle: string;
}> = {
  ar: {
    dir: "rtl",
    title: "سياسة الاسترداد والإلغاء",
    updated: "آخر تحديث: أبريل 2026",
    intro: "تلتزم شركة ROYAL SERVICE LIMITED (Royal Voyage) بتقديم سياسة إلغاء واسترداد شفافة وعادلة. يرجى قراءة هذه السياسة بعناية قبل إتمام أي حجز.",
    tableTitle: "جدول رسوم الإلغاء",
    tableHeaders: { when: "وقت الإلغاء", fee: "رسوم الإلغاء", note: "ملاحظة" },
    table: [
      { when: "خلال 24 ساعة من الحجز + 7 أيام قبل السفر", fee: "2% فقط (رسوم معالجة)", note: "استرداد كامل للباقي" },
      { when: "من 2 إلى 7 أيام قبل السفر", fee: "10% – 25%", note: "حسب سياسة شركة الطيران" },
      { when: "أقل من 48 ساعة قبل السفر", fee: "25% – 50%", note: "حسب نوع التذكرة" },
      { when: "تذكرة غير قابلة للاسترداد", fee: "لا استرداد", note: "يُشار إليها قبل الحجز" },
      { when: "إلغاء من قِبل شركة الطيران", fee: "0% — استرداد كامل", note: "أو إعادة حجز مجانية" },
    ],
    sections: [
      {
        heading: "1. الإلغاء خلال 24 ساعة",
        body: "إذا أُلغي الحجز خلال 24 ساعة من إجرائه وكان موعد السفر بعد 7 أيام على الأقل، يحق لك الحصول على استرداد كامل للمبلغ المدفوع مطروحاً منه 2% رسوم معالجة الدفع. هذا الشرط ينطبق على جميع أنواع التذاكر القابلة للاسترداد.",
      },
      {
        heading: "2. الإلغاء بعد 24 ساعة",
        body: "يخضع الاسترداد لسياسة شركة الطيران أو الفندق المعني. تتراوح رسوم الإلغاء عادةً بين 10% و50% من قيمة الحجز حسب:\n• الوقت المتبقي على موعد السفر\n• فئة التذكرة (اقتصادية، رجال أعمال، أولى)\n• سياسة شركة الطيران المحددة\nسنوضح لك رسوم الإلغاء المتوقعة قبل تأكيد طلب الإلغاء.",
      },
      {
        heading: "3. التذاكر غير القابلة للاسترداد",
        body: "بعض التذاكر الاقتصادية المخفضة غير قابلة للاسترداد. سيتم الإشارة بوضوح إلى هذا الشرط في صفحة تفاصيل الرحلة قبل إتمام الحجز. في بعض الحالات، يمكن تحويل قيمة التذكرة كرصيد لحجز مستقبلي مع شركة الطيران ذاتها.",
      },
      {
        heading: "4. إلغاء الرحلة من قِبل شركة الطيران",
        body: "في حال إلغاء الرحلة من قِبل شركة الطيران أو تأخيرها لأكثر من 5 ساعات، يحق لك:\n• استرداد كامل للمبلغ المدفوع دون أي رسوم\n• إعادة الحجز على رحلة بديلة بدون رسوم إضافية\nسنتولى التنسيق مع شركة الطيران نيابةً عنك لضمان حصولك على حقوقك كاملة.",
      },
      {
        heading: "5. سياسة استرداد الفنادق",
        body: "يخضع استرداد حجوزات الفنادق لسياسة كل فندق على حدة:\n• معظم الفنادق تتيح الإلغاء المجاني حتى 48 ساعة قبل موعد الوصول\n• بعض الفنادق تطبق سياسة عدم الاسترداد في حالات الحجز الخاص\n• ستجد شروط الإلغاء محددة بوضوح في صفحة تفاصيل كل فندق قبل الحجز",
      },
      {
        heading: "6. مدة الاسترداد حسب طريقة الدفع",
        body: "تستغرق عمليات الاسترداد المدد التالية حسب طريقة الدفع:\n• Stripe (Visa/Mastercard): 5-7 أيام عمل\n• Bankily: 1-3 أيام عمل\n• Masrvi: 1-3 أيام عمل\n• Sedad: 2-5 أيام عمل\n• التحويل البنكي: 7-14 يوم عمل\nسيتم إخطارك برسالة تأكيد عند معالجة طلب الاسترداد.",
      },
      {
        heading: "7. كيفية طلب الاسترداد",
        body: "لطلب استرداد، تواصل معنا عبر إحدى الطرق التالية:\n• الهاتف: +222 33 70 00 00\n• واتساب: +222 33 70 00 00\n• البريد الإلكتروني: suporte@royalvoyage.online\n\nيرجى تقديم المعلومات التالية:\n• رقم الحجز (PNR)\n• اسم المسافر الرئيسي\n• سبب الإلغاء\n• طريقة الدفع المستخدمة",
      },
      {
        heading: "8. حالات عدم الاسترداد",
        body: "لا يُطبق الاسترداد في الحالات التالية:\n• عدم الحضور للرحلة (No-Show) دون إلغاء مسبق\n• التأخر عن موعد المغادرة\n• رفض الصعود لأسباب تتعلق بالمسافر (وثائق غير صالحة، رفض التأشيرة)\n• التذاكر المستخدمة جزئياً (رحلات العودة غير المستخدمة)\n• الحجوزات المُلغاة بعد انتهاء المهلة المحددة",
      },
      {
        heading: "9. تعديل الحجوزات",
        body: "في بعض الحالات، يمكن تعديل الحجز بدلاً من إلغائه:\n• تغيير تاريخ السفر: يخضع لرسوم التعديل لدى شركة الطيران\n• تغيير اسم المسافر: غير مسموح به في معظم الحالات\n• ترقية الدرجة: متاحة حسب توفر المقاعد\nتواصل معنا في أقرب وقت ممكن لمعرفة خيارات التعديل المتاحة.",
      },
      {
        heading: "10. التواصل",
        body: "ROYAL SERVICE LIMITED — Royal Voyage\nتفرغ زين، نواكشوط، موريتانيا\nالبريد: suporte@royalvoyage.online\nالهاتف: +222 33 70 00 00\nواتساب: +222 33 70 00 00",
      },
    ],
    contactTitle: "تواصل معنا لطلب الاسترداد",
  },
  en: {
    dir: "ltr",
    title: "Refund & Cancellation Policy",
    updated: "Last updated: April 2026",
    intro: "ROYAL SERVICE LIMITED (Royal Voyage) is committed to providing a transparent and fair cancellation and refund policy. Please read this policy carefully before completing any booking.",
    tableTitle: "Cancellation Fee Schedule",
    tableHeaders: { when: "Cancellation Time", fee: "Cancellation Fee", note: "Note" },
    table: [
      { when: "Within 24h of booking + 7 days before travel", fee: "2% only (processing fee)", note: "Full refund of remainder" },
      { when: "2 to 7 days before travel", fee: "10% – 25%", note: "Per airline policy" },
      { when: "Less than 48 hours before travel", fee: "25% – 50%", note: "Per ticket type" },
      { when: "Non-refundable ticket", fee: "No refund", note: "Indicated before booking" },
      { when: "Airline-initiated cancellation", fee: "0% — Full refund", note: "Or free rebooking" },
    ],
    sections: [
      {
        heading: "1. Cancellation within 24 hours",
        body: "If a booking is cancelled within 24 hours of making it and the travel date is at least 7 days away, you are entitled to a full refund minus a 2% payment processing fee. This condition applies to all refundable ticket types.",
      },
      {
        heading: "2. Cancellation after 24 hours",
        body: "Refunds are subject to the policy of the relevant airline or hotel. Cancellation fees typically range from 10% to 50% depending on:\n• Time remaining before travel date\n• Ticket class (economy, business, first)\n• Specific airline policy\nWe will inform you of expected cancellation fees before confirming your cancellation request.",
      },
      {
        heading: "3. Non-refundable tickets",
        body: "Some discounted economy tickets are non-refundable. This condition will be clearly indicated on the flight details page before completing the booking. In some cases, the ticket value can be converted to credit for a future booking with the same airline.",
      },
      {
        heading: "4. Airline-initiated cancellations",
        body: "If a flight is cancelled by the airline or delayed by more than 5 hours, you are entitled to:\n• A full refund of the amount paid with no fees\n• Rebooking on an alternative flight at no extra charge\nWe will coordinate with the airline on your behalf to ensure you receive your full rights.",
      },
      {
        heading: "5. Hotel refund policy",
        body: "Hotel booking refunds are subject to each hotel's individual policy:\n• Most hotels allow free cancellation up to 48 hours before check-in\n• Some hotels apply a no-refund policy for special bookings\n• Cancellation terms are clearly specified on each hotel's detail page before booking",
      },
      {
        heading: "6. Refund timeline by payment method",
        body: "Refunds take the following time depending on payment method:\n• Stripe (Visa/Mastercard): 5-7 business days\n• Bankily: 1-3 business days\n• Masrvi: 1-3 business days\n• Sedad: 2-5 business days\n• Bank transfer: 7-14 business days\nYou will receive a confirmation message when your refund request is processed.",
      },
      {
        heading: "7. How to request a refund",
        body: "To request a refund, contact us via one of the following methods:\n• Phone: +222 33 70 00 00\n• WhatsApp: +222 33 70 00 00\n• Email: suporte@royalvoyage.online\n\nPlease provide the following information:\n• Booking number (PNR)\n• Main traveler's name\n• Reason for cancellation\n• Payment method used",
      },
      {
        heading: "8. Non-refundable cases",
        body: "Refunds do not apply in the following cases:\n• No-show (failure to appear for the flight without prior cancellation)\n• Missing the departure time\n• Denied boarding due to traveler-related reasons (invalid documents, visa refusal)\n• Partially used tickets (unused return flights)\n• Bookings cancelled after the specified deadline",
      },
      {
        heading: "9. Booking modifications",
        body: "In some cases, bookings can be modified instead of cancelled:\n• Date change: subject to airline modification fees\n• Name change: not permitted in most cases\n• Class upgrade: available subject to seat availability\nContact us as soon as possible to find out available modification options.",
      },
      {
        heading: "10. Contact",
        body: "ROYAL SERVICE LIMITED — Royal Voyage\nTevragh Zeina, Nouakchott, Mauritania\nEmail: suporte@royalvoyage.online\nPhone: +222 33 70 00 00\nWhatsApp: +222 33 70 00 00",
      },
    ],
    contactTitle: "Contact Us to Request a Refund",
  },
  fr: {
    dir: "ltr",
    title: "Politique de Remboursement et d'Annulation",
    updated: "Dernière mise à jour : avril 2026",
    intro: "ROYAL SERVICE LIMITED (Royal Voyage) s'engage à fournir une politique d'annulation et de remboursement transparente et équitable. Veuillez lire attentivement cette politique avant de finaliser toute réservation.",
    tableTitle: "Tableau des frais d'annulation",
    tableHeaders: { when: "Moment d'annulation", fee: "Frais d'annulation", note: "Note" },
    table: [
      { when: "Dans les 24h de la réservation + 7 jours avant le voyage", fee: "2% seulement (frais de traitement)", note: "Remboursement intégral du reste" },
      { when: "De 2 à 7 jours avant le voyage", fee: "10% – 25%", note: "Selon la politique de la compagnie" },
      { when: "Moins de 48 heures avant le voyage", fee: "25% – 50%", note: "Selon le type de billet" },
      { when: "Billet non remboursable", fee: "Aucun remboursement", note: "Indiqué avant la réservation" },
      { when: "Annulation par la compagnie aérienne", fee: "0% — Remboursement intégral", note: "Ou nouvelle réservation gratuite" },
    ],
    sections: [
      {
        heading: "1. Annulation dans les 24 heures",
        body: "Si une réservation est annulée dans les 24 heures suivant sa réalisation et que la date de voyage est au moins 7 jours plus tard, vous avez droit à un remboursement intégral moins 2% de frais de traitement.",
      },
      {
        heading: "2. Annulation après 24 heures",
        body: "Les remboursements sont soumis à la politique de la compagnie aérienne ou de l'hôtel concerné. Les frais varient entre 10% et 50% selon le temps restant avant le voyage, la classe du billet et la politique spécifique de la compagnie.",
      },
      {
        heading: "3. Billets non remboursables",
        body: "Certains billets économiques à prix réduit ne sont pas remboursables. Cette condition sera clairement indiquée avant la finalisation. Dans certains cas, la valeur peut être convertie en crédit pour une future réservation.",
      },
      {
        heading: "4. Annulations par la compagnie aérienne",
        body: "Si un vol est annulé par la compagnie ou retardé de plus de 5 heures, vous avez droit à un remboursement intégral sans frais ou à une nouvelle réservation gratuite. Nous coordonnerons avec la compagnie en votre nom.",
      },
      {
        heading: "5. Politique de remboursement hôtelière",
        body: "Les remboursements hôteliers sont soumis à la politique de chaque hôtel. La plupart permettent l'annulation gratuite jusqu'à 48 heures avant l'arrivée. Les conditions sont clairement indiquées sur la page de détails de chaque hôtel.",
      },
      {
        heading: "6. Délai de remboursement par mode de paiement",
        body: "Les remboursements prennent le temps suivant selon le mode de paiement :\n• Stripe (Visa/Mastercard) : 5-7 jours ouvrables\n• Bankily : 1-3 jours ouvrables\n• Masrvi : 1-3 jours ouvrables\n• Sedad : 2-5 jours ouvrables\n• Virement bancaire : 7-14 jours ouvrables",
      },
      {
        heading: "7. Comment demander un remboursement",
        body: "Pour demander un remboursement, contactez-nous via :\n• Téléphone : +222 33 70 00 00\n• WhatsApp : +222 33 70 00 00\n• Email : suporte@royalvoyage.online\n\nVeuillez fournir : numéro de réservation (PNR), nom du voyageur principal, raison de l'annulation, mode de paiement utilisé.",
      },
      {
        heading: "8. Cas non remboursables",
        body: "Les remboursements ne s'appliquent pas dans les cas suivants :\n• Non-présentation au vol sans annulation préalable\n• Retard à l'embarquement\n• Refus d'embarquement pour des raisons liées au voyageur\n• Billets partiellement utilisés\n• Réservations annulées après la date limite",
      },
      {
        heading: "9. Modifications de réservation",
        body: "Dans certains cas, les réservations peuvent être modifiées plutôt qu'annulées :\n• Changement de date : soumis aux frais de modification de la compagnie\n• Changement de nom : non autorisé dans la plupart des cas\n• Surclassement : disponible selon la disponibilité des sièges",
      },
      {
        heading: "10. Contact",
        body: "ROYAL SERVICE LIMITED — Royal Voyage\nTevragh Zeina, Nouakchott, Mauritanie\nEmail : suporte@royalvoyage.online\nTél : +222 33 70 00 00\nWhatsApp : +222 33 70 00 00",
      },
    ],
    contactTitle: "Contactez-nous pour demander un remboursement",
  },
};

export default function RefundScreen() {
  const colors = useColors();
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ar");
  const content = CONTENT[lang];
  const isRTL = lang === "ar";

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{content.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.langRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["ar", "en", "fr"] as Lang[]).map((l) => (
          <Pressable key={l} style={[styles.langBtn, lang === l && { backgroundColor: colors.primary }]} onPress={() => setLang(l)}>
            <Text style={[styles.langText, { color: lang === l ? "#fff" : colors.muted }]}>
              {l === "ar" ? "العربية" : l === "en" ? "English" : "Français"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: colors.muted, textAlign: isRTL ? "right" : "left" }]}>{content.updated}</Text>

        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: "#1B2B5E10", borderColor: "#1B2B5E30" }]}>
          <IconSymbol name="info.circle.fill" size={18} color="#1B2B5E" />
          <Text style={[styles.introText, { color: "#1B2B5E", textAlign: isRTL ? "right" : "left" }]}>{content.intro}</Text>
        </View>

        {/* Cancellation table */}
        <Text style={[styles.tableTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{content.tableTitle}</Text>
        <View style={[styles.table, { borderColor: colors.border }]}>
          <View style={[styles.tableHeader, { backgroundColor: "#1B2B5E" }]}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>{content.tableHeaders.when}</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>{content.tableHeaders.fee}</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>{content.tableHeaders.note}</Text>
          </View>
          {content.table.map((row, i) => (
            <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? colors.surface : colors.background, borderTopColor: colors.border }]}>
              <Text style={[styles.tableCell, { flex: 2, color: colors.foreground }]}>{row.when}</Text>
              <Text style={[styles.tableCellFee, { flex: 1.5, color: row.fee.includes("0%") ? "#22C55E" : row.fee.includes("لا") || row.fee.includes("No") || row.fee.includes("Aucun") ? "#EF4444" : "#F59E0B" }]}>{row.fee}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, color: colors.muted }]}>{row.note}</Text>
            </View>
          ))}
        </View>

        {/* Sections */}
        {content.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.primary, textAlign: isRTL ? "right" : "left" }]}>{section.heading}</Text>
            <Text style={[styles.sectionBody, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{section.body}</Text>
          </View>
        ))}

        {/* CTA */}
        <Text style={[styles.contactTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{content.contactTitle}</Text>
        <View style={styles.ctaRow}>
          <Pressable style={[styles.ctaBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={() => Linking.openURL("tel:+22233700000")}>
            <IconSymbol name="phone.fill" size={16} color="#fff" />
            <Text style={styles.ctaBtnText}>+222 33 70 00 00</Text>
          </Pressable>
          <Pressable style={[styles.ctaBtn, { backgroundColor: "#25D366", flex: 1 }]} onPress={() => Linking.openURL("https://wa.me/22233700000")}>
            <IconSymbol name="paperplane.fill" size={16} color="#fff" />
            <Text style={styles.ctaBtnText}>WhatsApp</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.emailBtn, { borderColor: colors.border }]} onPress={() => Linking.openURL("mailto:suporte@royalvoyage.online")}>
          <IconSymbol name="envelope.fill" size={16} color={colors.primary} />
          <Text style={[styles.emailBtnText, { color: colors.primary }]}>suporte@royalvoyage.online</Text>
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  langRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 0.5 },
  langBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  langText: { fontSize: 13, fontWeight: "600" },
  scrollContent: { padding: 16 },
  updated: { fontSize: 12, marginBottom: 14 },
  introCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16, alignItems: "flex-start" },
  introText: { fontSize: 13, lineHeight: 20, flex: 1 },
  tableTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  table: { borderRadius: 10, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  tableHeader: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 8 },
  tableHeaderCell: { fontSize: 11, fontWeight: "700", color: "#fff", textAlign: "center" },
  tableRow: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 0.5 },
  tableCell: { fontSize: 11, lineHeight: 16, textAlign: "center" },
  tableCellFee: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  section: { marginBottom: 18 },
  sectionHeading: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  contactTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  ctaRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  ctaBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  emailBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  emailBtnText: { fontSize: 14, fontWeight: "500" },
});
