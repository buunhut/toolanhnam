import React from "react";
import { NavLink } from "react-router-dom";

const TopMenu = () => {
  return (
    <div id="topMenu">
      <ul>
        <li>
          <NavLink to={"/"}>V1</NavLink>
        </li>
        <li>
          <NavLink to={"/v2"}>V2</NavLink>
        </li>
      </ul>
    </div>
  );
};

export default TopMenu;
