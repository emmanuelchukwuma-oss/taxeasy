"use client";

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#f0fdf4" },
  header: { fontSize: 24, marginBottom: 10, textAlign: "center", color: "#064e3b", fontWeight: "bold" },
  subHeader: { fontSize: 12, marginBottom: 40, textAlign: "center", color: "#064e3b" },
  section: { margin: 10, padding: 20, fontSize: 12, backgroundColor: "#ffffff" },
  row: { flexDirection: "row", marginBottom: 15, paddingBottom: 5 },
  label: { width: "40%", fontWeight: "bold", color: "#064e3b" },
  value: { width: "60%", color: "#334155" },
  footer: { marginTop: 40, fontSize: 10, color: "#64748b", textAlign: "center" },
});

export const TccDocument = ({ record, identityType, maskedIdentity }) => {
  const year = new Date(record.paidAt).getFullYear();
  // record.reference is typically TXE-YYYY-XXXXXX, so substring(4, 13) or split
  const refParts = record.reference.split("-");
  const randomPart = refParts.length > 2 ? refParts[2] : record.reference.substring(0, 6);
  const ref = `TCC-${year}-${randomPart}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>TAX CLEARANCE CERTIFICATE</Text>
        <Text style={styles.subHeader}>TaxEasy Official Receipt & Clearance</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Certificate Number:</Text>
            <Text style={styles.value}>{ref}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Taxpayer Identity:</Text>
            <Text style={styles.value}>{identityType.toUpperCase()} {maskedIdentity}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid:</Text>
            <Text style={styles.value}>NGN {record.amountNaira.toLocaleString("en-US")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date:</Text>
            <Text style={styles.value}>{new Date(record.paidAt).toLocaleString("en-NG")}</Text>
          </View>
        </View>
        <Text style={styles.footer}>
          This document verifies that the taxpayer has discharged their tax liabilities as stated.
          Verified by TaxEasy.
        </Text>
      </Page>
    </Document>
  );
};

export default function TccDownloadButton({ record, identityType, maskedIdentity }) {
  if (!record) return null;
  const year = new Date(record.paidAt).getFullYear();
  const refParts = record.reference.split("-");
  const randomPart = refParts.length > 2 ? refParts[2] : record.reference.substring(0, 6);
  const fileName = `TCC-${year}-${randomPart}.pdf`;

  return (
    <PDFDownloadLink
      document={<TccDocument record={record} identityType={identityType} maskedIdentity={maskedIdentity} />}
      fileName={fileName}
      className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#064e3b] text-base font-semibold text-white mt-4"
    >
      {({ blob, url, loading, error }) => (loading ? "Preparing PDF..." : "Download TCC PDF")}
    </PDFDownloadLink>
  );
}
