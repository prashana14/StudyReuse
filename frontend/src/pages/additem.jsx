import React from "react";

function AddItem() {
  return (
    <div className="container mt-5">
      <h2>Add New Item</h2>
      <form className="mt-4">
        <input type="text" className="form-control mb-3" placeholder="Item Name" />
        <input type="text" className="form-control mb-3" placeholder="Category" />
        <input type="file" className="form-control mb-3" />
        <button className="btn btn-primary w-100">Upload Item</button>
      </form>
    </div>
  );
}

export default AddItem;
