import { useState, useRef } from "react";
import supabase from "./supabase";

const CATEGORY_MAP = {
  "Tea": "0c4de31e-67d2-463d-8a4b-27444a0a59c6",
  "Drinks": "0de00a04-76de-4334-bccd-6c13ea8eb688",
  "Salads": "1af6780e-3619-4f5e-89c2-f31dd6130393",
  "Rice Dishes": "1cad6742-17e8-4f5e-bdd8-87c8a90d4f69",
  "Juices": "34daf59a-6fa7-4a1c-9d81-fab6b53a9718",
  "Seafood": "3680f74c-c453-40c8-aaf3-fed75b0c6324",
  "Vegan": "5091132e-5a51-48ed-9ec1-a2acc7f0aa76",
  "Soups": "5bb02936-96d5-4b17-b9c9-0d41197bb32c",
  "Chicken": "5bfde4dd-02b7-47ed-ac57-5ee0cbcb669f",
  "Burgers": "5d7e7424-cf08-44a4-b840-57188b364419",
  "Coffee": "7b68c0d3-0fbe-4baa-83d3-2b59851e3d66",
  "Pizza": "9504a4cd-c557-465d-9e2d-90b4914f15ce",
  "Kids Menu": "a25aea27-3f83-4221-9d2f-f596433025e5",
  "Steaks": "a28496e9-4ed7-4c59-847f-01dd066551d4",
  "Appetizers": "a5af5eb7-772e-4ee2-aaed-218dfd1a39f2",
  "Pasta": "a6600665-64cc-4c76-aa71-c49b4e529053",
  "Desserts": "a825030f-cf65-45bc-ae43-b67223dad95c",
  "Smoothies": "b1e1d87b-83dc-4a65-a29b-b73dbcf101af",
  "Wraps": "be2f35b8-e7d0-459f-a069-d17535b3ebf4",
  "Breakfast": "c85521ad-daf9-432a-a938-0db2300e1f94",
  "Cakes": "c9d14119-3d10-41fa-ae81-e0fc30c4706f",
  "Vegetarian": "d3a803f6-e38e-4be9-a6f6-c9cf1446c482",
  "Sandwiches": "d52090cd-54a5-4b09-9148-27e4e7f46a60",
  "Ice Cream": "fd146bcc-0b8f-4988-90b0-70bfc66694c7"
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