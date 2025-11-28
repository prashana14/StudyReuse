function Navbar() {
  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>MyReactApp</h2>
      <ul style={styles.links}>
        <li>Home</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
    </nav>
  );
}

export default Navbar;
