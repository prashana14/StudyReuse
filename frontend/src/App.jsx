import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from "react-bootstrap";

// Import your pages
import Home from './pages/home';
// import Items from './pages/items';
// import AddItem from './pages/additem';
// import Login from './pages/login';
// import Register from './pages/register';

// Import common components
// import Navbar from './components/navbar';
// import Footer from './components/footer';

// function App() {
//   return (
//     <BrowserRouter>
//       {/* <Navbar /> */}

//       {/* <Routes> */}
//         {/* <Route path="/" element={<Home />} /> */}
//         {/* <Route path="/items" element={<Items />} /> */}
//         {/* <Route path="/add-item" element={<AddItem />} /> */}
//         {/* <Route path="/login" element={<Login />} /> */}
//         {/* <Route path="/register" element={<Register />} /> */}
//         {/* Optional: a fallback 404 page */}
//         {/* <Route path="*" element={<h1>Page Not Found</h1>} /> */}
//       {/* </Routes> */}

//       {/* <Footer /> */}
//     </BrowserRouter>
//   );
// }

function App() {
  return (
    <div>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="#home">My App</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link href="#features">Features</Nav.Link>
            <Nav.Link href="#pricing">Pricing</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <div className="text-center mt-5">
        <h1>Welcome!</h1>
        <Button variant="primary">Click Me</Button>
      </div>
    </div>
  );
}


export default App;
