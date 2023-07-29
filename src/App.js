import Test from "./components/Test";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route element={<Test />} path="/" />
        </Routes>
      </Router>
    </>
  );
}

export default App;
