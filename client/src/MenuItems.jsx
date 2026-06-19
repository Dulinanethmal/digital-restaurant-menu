import React from "react";

export default function MenuItems({ menuItems, setShowAddModal, setEditItem, deleteFood }) {
  return (
    <div className="section-card">
      <div className="section-head">
        <div>
          <div className="section-title">Menu Items</div>
          <div className="section-sub">Click Edit to update an item, or Delete to remove it completely</div>
        </div>
      </div>
      <div className="menu-list">
        {menuItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽</div>
            No items yet —{" "}
            <span style={{ color: "var(--gold)", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => setShowAddModal(true)}>add your first item</span>
          </div>
        ) : menuItems.map(item => (
          <div className="menu-item-row" key={item.id}>
            {item.image_url
              ? <img className="menu-thumb" src={item.image_url} alt={item.name} onError={e => e.target.style.display = "none"} />
              : <div className="menu-thumb-ph">🍽</div>}
            <div className="menu-info">
              <div className="menu-name">{item.name}</div>
              <div className="menu-desc">{item.description}</div>
              <div className="menu-tags">
                {item.category && <span className="menu-tag">{item.category}</span>}
                {item.badge && <span className="menu-tag" style={{ background: "rgba(139,92,246,0.1)", color: "#7C3AED" }}>{item.badge}</span>}
              </div>
            </div>
            <div className="menu-price">${Number(item.price).toFixed(2)}</div>
            <div className="menu-actions">
              <button className="edit-btn" onClick={() => setEditItem(item)}>Edit</button>
              <button className="delete-btn" onClick={() => deleteFood(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}