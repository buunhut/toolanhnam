import React from "react";
import TopMenu from "./components/TopMenu";
import { Outlet } from "react-router-dom";

const Home = () => {
  return (
    <div>
      <TopMenu />
      <Outlet />
    </div>
  );
};

export default Home;
