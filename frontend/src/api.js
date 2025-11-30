const API_URL = "http://localhost:4000/api";

export const fetchItems = async () => {
    const res = await fetch(`${API_URL}/items`);
    return res.json();
};

export const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/users`);
    return res.json();
};
