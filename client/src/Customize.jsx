import { useEffect, useState, useRef } from "react";
import supabase from "./supabase";

export default function Customize({ showToast }) {
  const logoRef = useRef();
  const bannerRef = useRef();
  
  const [settingsId, setSettingsId] = useState(null);
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Fetch current settings when the tab opens
  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data, error } = await supabase.from("shop_settings").select("*").limit(1).single();
    if (data) {
      setSettingsId(data.id);
      setShopName(data.shop_name || "");
      setDescription(data.description || "");
      setLogoUrl(data.logo_url || "");
      setBannerUrl(data.banner_url || "");
    }
  }

  // Handle uploading either the logo or the banner
  async function handleImageUpload(file, type) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
    
    const isLogo = type === 'logo';
    isLogo ? setUploadingLogo(true) : setUploadingBanner(true);
    
    const ext = file.name.split(".").pop();
    const fileName = `brand-${type}-${Date.now()}.${ext}`;
    
    // Reusing your food-images bucket to keep things simple
    const { data, error } = await supabase.storage.from("food-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
    
    if (error) {
        alert("Upload failed: " + error.message);
        isLogo ? setUploadingLogo(false) : setUploadingBanner(false);
        return;
    }
    
    const { data: urlData } = supabase.storage.from("food-images").getPublicUrl(data.path);
    
    isLogo ? setLogoUrl(urlData.publicUrl) : setBannerUrl(urlData.publicUrl);
    isLogo ? setUploadingLogo(false) : setUploadingBanner(false);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      shop_name: shopName,
      description: description,
      logo_url: logoUrl,
      banner_url: bannerUrl,
    };

    let error;
    // If we already have settings, update them. Otherwise, insert a new row.
    if (settingsId) {
      const res = await supabase.from("shop_settings").update(payload).eq("id", settingsId);
      error = res.error;
    } else {
      const res = await supabase.from("shop_settings").insert([payload]);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      showToast("Failed to save settings: " + error.message, true);
    } else {
      showToast("Shop customizations saved successfully!");
      fetchSettings(); // Refresh to get the ID if it was a new insert
    }
  }

  return (
    <div className="section-card">
      <div className="section-head">
        <div>
          <div className="section-title">Shop Customization</div>
          <div className="section-sub">Update your brand name, logo, and hero banner</div>
        </div>
      </div>
      
      <div className="form-wrap" style={{ padding: "24px" }}>
        <div className="form-2">
          <div className="field-group">
            <label className="field-label">Shop Name</label>
            <input className="field-input" placeholder="e.g. Lumière & Co." value={shopName} onChange={e => setShopName(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Short Description / Subtitle</label>
            <input className="field-input" placeholder="e.g. Fine Dining & Drinks" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>

        <div className="form-divider" style={{ margin: "24px 0" }}>
          <div className="form-divider-line" />
          <span className="form-divider-text">Branding Images</span>
          <div className="form-divider-line" />
        </div>

        <div className="form-2">
          {/* Logo Upload */}
          <div className="field-group">
            <label className="field-label">Shop Logo (1:1 aspect ratio)</label>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#f8f8f8", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "24px" }}>🏪</span>}
              </div>
              <div style={{ flex: 1 }}>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageUpload(e.target.files[0], 'logo')} />
                <button className="btn-ghost" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}>
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </button>
                {logoUrl && <div className="url-toggle" style={{ marginLeft: "12px", color: "#EF4444" }} onClick={() => setLogoUrl("")}>Remove</div>}
              </div>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="field-group">
            <label className="field-label">Hero Banner (16:9 or Wide)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
              <div style={{ width: "100%", height: "120px", borderRadius: "12px", background: "#f8f8f8", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {bannerUrl ? <img src={bannerUrl} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "var(--muted)", fontSize: "13px" }}>No banner selected</span>}
              </div>
              <div>
                <input ref={bannerRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageUpload(e.target.files[0], 'banner')} />
                <button className="btn-ghost" onClick={() => bannerRef.current?.click()} disabled={uploadingBanner}>
                  {uploadingBanner ? "Uploading..." : "Upload Banner"}
                </button>
                {bannerUrl && <div className="url-toggle" style={{ marginLeft: "12px", color: "#EF4444" }} onClick={() => setBannerUrl("")}>Remove</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving || uploadingLogo || uploadingBanner}>
            {saving ? "Saving Changes..." : "Save Customizations"}
          </button>
        </div>
      </div>
    </div>
  );
}