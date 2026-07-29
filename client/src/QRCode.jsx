import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCode({ showToast }) {
  // 1. Get the current logged-in restaurant's shop_id
  const session = JSON.parse(localStorage.getItem("custom_session") || "{}");
  const shopId = session.shop_id;

  // 2. Embed the shopId directly into the QR code's base URL
  const baseUrl = `${window.location.origin}/user?shop=${shopId}`;
  
  const [tableNumber, setTableNumber] = useState("");
  const [activeUrl, setActiveUrl] = useState(baseUrl);
  const [isCustom, setIsCustom] = useState(false);
  const qrRef = useRef(null);

  // Generate a new QR code (General or Table-specific)
  const handleGenerate = () => {
    if (!shopId) {
      alert("Error: Shop ID is missing. Please log in again.");
      return;
    }

    if (tableNumber.trim() === "") {
      setActiveUrl(baseUrl);
      setIsCustom(false);
      if (showToast) showToast("General store QR code generated!");
    } else {
      // 3. Use '&' instead of '?' for the table number because '?shop=...' is already in the URL
      setActiveUrl(`${baseUrl}&table=${tableNumber}`);
      setIsCustom(true);
      if (showToast) showToast(`QR code generated for Table ${tableNumber}!`);
    }
  };

  // Reset/Delete the custom QR code
  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to clear this QR code?")) return;
    setTableNumber("");
    setActiveUrl(baseUrl);
    setIsCustom(false);
    if (showToast) showToast("Custom QR code deleted. Reverted to default.");
  };

  // Download the QR code as an image to print
  const handleDownload = () => {
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = isCustom ? `Table_${tableNumber}_QR.png` : "Restaurant_Menu_QR.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    if (showToast) showToast("QR Code downloaded!");
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftCol}>
        <h2 style={styles.heading}>Generate QR Code</h2>
        <p style={styles.subtext}>
          Print this QR code and place it on your tables. When customers scan it, they will be sent directly to your specific digital menu.
        </p>

        <div style={styles.formGroup}>
          <label style={styles.label}>Table Number (Optional)</label>
          <input
            type="text"
            placeholder="e.g., 12"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            style={styles.input}
          />
          <p style={{ fontSize: "12px", color: "#777", marginTop: "5px" }}>
            Leave blank for a general menu QR, or enter a number to create a table-specific QR code.
          </p>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handleGenerate} style={styles.btnPrimary}>
            Generate QR Code
          </button>
          {isCustom && (
            <button onClick={handleDelete} style={styles.btnDanger}>
              Delete Custom QR
            </button>
          )}
        </div>
      </div>

      <div style={styles.rightCol}>
        <div style={styles.qrCard} ref={qrRef}>
          <h3 style={{ marginBottom: "20px", color: "#1A1A1A" }}>
            {isCustom ? `Table ${tableNumber}` : "Scan for Menu"}
          </h3>
          
          <div style={styles.qrWrapper}>
            <QRCodeCanvas 
              value={activeUrl} 
              size={200} 
              bgColor={"#ffffff"} 
              fgColor={"#1a1a1a"} 
              level={"H"} // High error correction
              includeMargin={true}
            />
          </div>

          <p style={{ marginTop: "15px", fontSize: "12px", color: "#777", wordBreak: "break-all" }}>
            {activeUrl}
          </p>

          <button onClick={handleDownload} style={styles.btnOutline}>
            ↓ Download Image
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline styles to match your premium Admin layout
const styles = {
  container: { display: "flex", gap: "40px", flexWrap: "wrap", backgroundColor: "#fff", padding: "30px", borderRadius: "16px", border: "1px solid #eaeaea" },
  leftCol: { flex: "1 1 300px" },
  rightCol: { flex: "1 1 300px", display: "flex", justifyContent: "center", alignItems: "center" },
  heading: { fontSize: "24px", marginBottom: "10px", color: "#1a1a1a" },
  subtext: { color: "#777", marginBottom: "30px", lineHeight: "1.5" },
  formGroup: { marginBottom: "20px" },
  label: { display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" },
  input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" },
  buttonGroup: { display: "flex", gap: "10px", marginTop: "20px" },
  btnPrimary: { padding: "12px 20px", backgroundColor: "#F4B400", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  btnDanger: { padding: "12px 20px", backgroundColor: "#DC2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  btnOutline: { marginTop: "20px", padding: "10px 20px", backgroundColor: "transparent", color: "#1a1a1a", border: "1px solid #1a1a1a", borderRadius: "8px", cursor: "pointer", width: "100%", fontWeight: "500" },
  qrCard: { backgroundColor: "#f8f8f8", padding: "40px", borderRadius: "16px", textAlign: "center", border: "1px solid #eaeaea", width: "100%", maxWidth: "350px" },
  qrWrapper: { padding: "10px", backgroundColor: "#fff", borderRadius: "12px", display: "inline-block", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }
};