import React, { useEffect, useState } from "react";
import "./app.scss";
import InputV1 from "./InputV1";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import InputV2 from "./InputV2";
import Home from "./Home";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route index element={<InputV1 />} />
          <Route path="/v2" element={<InputV2 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
