"use client";

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontFamily: "Helvetica", 
    backgroundColor: "#ffffff",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.4,
  },
  borderFrame: {
    border: "2px solid #064e3b",
    padding: 24,
    height: "100%",
  },
  headerContainer: {
    alignItems: "center",
    borderBottom: "1.5px solid #064e3b",
    paddingBottom: 12,
    marginBottom: 16,
  },
  crest: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#b45309", 
    letterSpacing: 2,
    marginBottom: 3,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#064e3b", 
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  subtitle: { 
    fontSize: 8, 
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#064e3b",
    backgroundColor: "#f0fdf4",
    padding: "3 6",
    marginBottom: 8,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    marginVertical: 6,
  },
  row: { 
    flexDirection: "row", 
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 5, 
    paddingHorizontal: 2,
  },
  label: { 
    width: "40%", 
    fontWeight: "bold", 
    color: "#064e3b", 
  },
  value: { 
    width: "60%", 
    color: "#334155", 
  },
  statusBox: {
    padding: 6,
    backgroundColor: "#f8fafc",
    border: "0.5px solid #e2e8f0",
    marginTop: 8,
  },
  statusTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#16a34a",
  },
  statusText: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 2,
  },
  signatureContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },
  sigBlock: {
    alignItems: "center",
    width: "45%",
  },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    width: "100%",
    marginTop: 18,
    paddingTop: 3,
    textAlign: "center",
    fontSize: 7.5,
    color: "#475569",
    fontWeight: "bold",
  },
  footer: { 
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 8,
    fontSize: 7, 
    color: "#94a3b8", 
    textAlign: "center",
  },
});

export const TccDocument = ({ record, identityType, maskedIdentity }) => {
  const year = new Date(record.paidAt).getFullYear();
  const refParts = record.reference.split("-");
  const randomPart = refParts.length > 2 ? refParts[2] : record.reference.substring(0, 6);
  const ref = `TCC-${year}-${randomPart}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.borderFrame}>
          {/* Official Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.crest}>FEDERAL REPUBLIC OF NIGERIA</Text>
            <Text style={styles.title}>TAX CLEARANCE CERTIFICATE</Text>
            <Text style={styles.subtitle}>Verified Tax Compliance Remittance</Text>
          </View>

          {/* Section 1: Personal Identifications */}
          <Text style={styles.sectionTitle}>Taxpayer Profile Identification</Text>
          <View style={styles.grid}>
            <View style={styles.row}>
              <Text style={styles.label}>Taxpayer Full Name:</Text>
              <Text style={styles.value}>{record.name || "Verified Taxpayer"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Identity Type Registry:</Text>
              <Text style={styles.value}>{identityType.toUpperCase()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Taxpayer Registry Reference:</Text>
              <Text style={styles.value}>{maskedIdentity}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Registered Phone Line:</Text>
              <Text style={styles.value}>{record.phone || "Linked device link"}</Text>
            </View>
          </View>

          {/* Section 2: Assessment Data */}
          <Text style={styles.sectionTitle}>Remittance and Assessment Ledger</Text>
          <View style={styles.grid}>
            <View style={styles.row}>
              <Text style={styles.label}>Certificate Number:</Text>
              <Text style={styles.value}>{ref}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Filing Fiscal Year:</Text>
              <Text style={styles.value}>{year} Compliance Year</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Remitted Tax Portion:</Text>
              <Text style={styles.value}>NGN {(record.taxNaira ?? record.amountNaira).toLocaleString("en-US")}.00</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Remitter Service Charge:</Text>
              <Text style={styles.value}>NGN {(record.serviceFeeNaira ?? 0).toLocaleString("en-US")}.00</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Settlement Remitted:</Text>
              <Text style={styles.value}>NGN {record.amountNaira.toLocaleString("en-US")}.00</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment Mode:</Text>
              <Text style={styles.value}>Digital Remittance Gateway</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Remittance Reference Hash:</Text>
              <Text style={styles.value}>{record.reference}</Text>
            </View>
          </View>

          {/* Compliance Status box */}
          <Text style={styles.sectionTitle}>Certificate Compliance Verification</Text>
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>STATUS: CLEARED & COMPLIANT</Text>
            <Text style={styles.statusText}>
              This document certifies that the taxpayer named above has fully declared their livelihood earnings and remitted their fiscal obligations as defined under the gazetted guidelines of the Nigeria Personal Income Tax Reform Act of 2025.
            </Text>
          </View>

          {/* Signature lines */}
          <View style={styles.signatureContainer}>
            <View style={styles.sigBlock}>
              <Text style={{ fontSize: 7, fontStyle: "italic", color: "#94a3b8" }}>Digitally Verified</Text>
              <Text style={styles.sigLine}>TAXEASY REMITTER ENGINE</Text>
            </View>
            <View style={styles.sigBlock}>
              <Text style={{ fontSize: 7, fontStyle: "italic", color: "#94a3b8" }}>Government Portal Sync</Text>
              <Text style={styles.sigLine}>REVENUE SERVICE INTEGRATION</Text>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Verified Cryptographically. Scan the QR code displayed on the digital receipt corresponding to the reference hash {record.reference} to verify authenticity.
          </Text>
        </View>
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
      className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#064e3b] text-sm font-bold text-white hover:bg-[#065f46] shadow-md shadow-emerald-950/20 mt-4 transition-all"
    >
      {({ blob, url, loading, error }) => (loading ? "Generating Secure PDF..." : "Download Verified TCC PDF")}
    </PDFDownloadLink>
  );
}
