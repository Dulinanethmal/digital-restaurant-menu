import { useState, useRef } from "react";
import supabase from "./supabase";

// eslint-disable-next-line react-refresh/only-export-components
export const CATEGORY_MAP = {
  "Rice": "1d51391e-93c4-4e24-b701-05b08ba3ed4d",
  "Kottu": "83cb5057-e88e-4c7d-8a27-0abf9c7fcced",
  "Pizza": "57ba7208-cfbe-4b71-ab70-7b288e22b4c6",
  "Burger": "f66cc25d-f887-46a9-bdbd-2c5b6625871f",
  "Chicken": "e6b97334-1ce2-41ef-bd9a-ed22ef97da35",
  "Seafood": "bcd73ea0-3215-4508-b544-3737690d5b19",
  "Desserts": "52efd91f-a3fa-4a31-8222-5d7789c3e796",
  "Soft Drinks": "d7ad31e4-ef1f-4133-a1ca-3ef5df240671"
};

const CATEGORIES = Object.keys(CATEGORY_MAP);
const BADGES = ["Chef's Pick", "Popular", "Signature", "New", "Spicy", "Vegetarian", "Gluten Free"];

export default function FoodForm({ initial = {}, onSave, onCancel, saving }) {
  const fileRef = useRef();
  const [name, setName] = useState(initial.name || "");
  const [description, setDescription] = useState(initial.description || "");
  const [price, setPrice] = useState(initial.price || "");
  const [category, setCategory] = useState(initial.category || "Burgers");
  
  const categoryId = CATEGORY_MAP[category] || "";

  const [imageUrl, setImageUrl] = useState(initial.image_url || "");
  const [imagePreview, setImagePreview] = useState(initial.image_url || "");
  const [badge, setBadge] = useState(initial.badge || "");
  
  const [useUrl, setUseUrl] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
    
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    
    setUploading(true); 
    setUploadProgress(30);
    
    const ext = file.name.split(".").pop();
    const fileName = `food-${Date.now()}.${ext}`;
    
    const { data, error } = await supabase.storage.from("food-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
    
    setUploadProgress(90);
    
    if (error) { 
        alert("Upload failed: " + error.message); 
        setImagePreview(""); 
        setUploading(false); 
        setUploadProgress(0); 
        return; 
    }
    
    const { data: urlData } = supabase.storage.from("food-images").getPublicUrl(data.path);
    setImageUrl(urlData.publicUrl);
    setUploadProgress(100);
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
  }

  function handleDrop(e) { 
      e.preventDefault(); 
      setDragging(false); 
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); 
  }

  function removeImage() { 
      setImageUrl(""); 
      setImagePreview(""); 
      if (fileRef.current) fileRef.current.value = ""; 
  }

  function submit() {
    if (!name.trim() || !description.trim() || !price) { alert("Name, description and price are required"); return; }
    onSave({
      name: name.trim(), 
      description: description.trim(), 
      price: Number(price),
      category: category, 
      category_id: categoryId,
      image_url: imageUrl || null,
      badge: badge || null
    });
  }

  return (
    <div className="form-wrap">
      <div className="form-2">
        <div className="field-group">
          <label className="field-label">Item Name <span className="field-req">*</span></label>
          <input className="field-input" placeholder="e.g. Truffle Wagyu Burger" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Category <span className="field-req">*</span></label>
          <select className="field-select" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Description <span className="field-req">*</span></label>
        <textarea className="field-textarea" placeholder="e.g. Premium wagyu beef, black truffle aioli, aged cheddar, brioche bun"
          value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div className="form-2">
        <div className="field-group">
          <label className="field-label">Price (USD) <span className="field-req">*</span></label>
          <input className="field-input" type="number" placeholder="0.00" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Category ID (Auto-Generated)</label>
          <input 
            className="field-input" 
            type="text" 
            value={categoryId} 
            disabled 
            style={{ backgroundColor: "#eaeaea", color: "var(--text-muted)", cursor: "not-allowed" }} 
          />
        </div>
      </div>

      <div className="form-divider">
        <div className="form-divider-line" />
        <span className="form-divider-text">Image</span>
        <div className="form-divider-line" />
      </div>

      {!useUrl ? (
        <div className="field-group">
          <label className="field-label">Food Image</label>
          {!imagePreview ? (
            <div
              className={`img-upload-zone${dragging ? " drag" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
              <div className="upload-icon">📷</div>
              <div className="upload-label">Drag & drop or <span className="upload-link">browse</span></div>
              <div className="upload-sub">JPG, PNG, WEBP — max 5 MB</div>
              {uploading && <div className="upload-progress"><div className="upload-progress-bar" style={{ width: uploadProgress + "%" }} /></div>}
            </div>
          ) : (
            <div className="img-preview-row">
              <div className="img-preview-wrap">
                <img className="img-preview" src={imagePreview} alt="Preview" />
                <button className="img-preview-remove" onClick={removeImage}>✕</button>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--dark)", marginBottom: 4 }}>
                  {uploading ? "Uploading…" : "✓ Image ready"}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {imageUrl && !uploading ? "Saved to Supabase Storage" : "Processing…"}
                </div>
                {uploading && <div className="upload-progress" style={{ width: 160, marginTop: 8 }}><div className="upload-progress-bar" style={{ width: uploadProgress + "%" }} /></div>}
              </div>
            </div>
          )}
          <span className="url-toggle" onClick={() => setUseUrl(true)}>Use image URL instead →</span>
        </div>
      ) : (
        <div className="field-group">
          <label className="field-label">Image URL</label>
          <input className="field-input" type="text" placeholder="https://…" value={imageUrl} onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value); }} />
          {imageUrl && <img src={imageUrl} alt="Preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, marginTop: 8, border: "1px solid var(--border)" }} onError={e => e.target.style.display = "none"} /> }
          <span className="url-toggle" onClick={() => { setUseUrl(false); setImageUrl(""); setImagePreview(""); }}>← Upload a file instead</span>
        </div>
      )}

      <div className="form-divider">
        <div className="form-divider-line" />
        <span className="form-divider-text">Extra Details</span>
        <div className="form-divider-line" />
      </div>

      <div className="field-group">
        <label className="field-label">Badge</label>
        <div className="chip-row">
          <div className={`chip${badge === "" ? " on" : ""}`} onClick={() => setBadge("")}>None</div>
          {BADGES.map(b => <div key={b} className={`chip${badge === b ? " on" : ""}`} onClick={() => setBadge(b)}>{b}</div>)}
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: "16px" }}>
        <button className="btn-primary" onClick={submit} disabled={saving || uploading}>
          {saving ? "Saving…" : uploading ? "Uploading image…" : initial.id ? "Save Changes" : "Add to Menu"}
        </button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}