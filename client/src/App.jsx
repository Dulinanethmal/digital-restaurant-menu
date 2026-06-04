import { useEffect, useState } from "react";
import supabase from "./supabase";

function App() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  async function fetchMenuItems() {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*");

    if (error) {
      console.error("Supabase Error:", error);
    } else {
      setMenuItems(data);
    }
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        Restaurant Menu
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {menuItems.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <h2>{item.name}</h2>

            <p>{item.description}</p>

            <h3>${item.price}</h3>

            <button
              style={{
                padding: "10px",
                cursor: "pointer",
              }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;