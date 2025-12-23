import { Link } from "react-router-dom";

const ItemCard = ({ item }) => {
  return (
    <div className="card m-2 shadow-sm" style={{ width: "18rem" }}>
      {item.image ? (
        <img
          src={item.image}
          alt={item.title}
          className="card-img-top"
          style={{ height: "200px", objectFit: "cover" }}
        />
      ) : (
        <div
          className="card-img-top bg-secondary d-flex align-items-center justify-content-center"
          style={{ height: "200px", color: "#fff" }}
        >
          No Image
        </div>
      )}

      <div className="card-body">
        <h5 className="card-title">{item.title}</h5>
        <p className="card-text">Rs. {item.price}</p>
        <Link to={`/item/${item._id}`} className="btn btn-primary">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ItemCard;
