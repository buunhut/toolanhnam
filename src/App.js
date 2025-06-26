import React, { useEffect, useState } from "react";
import "./app.scss";
import * as XLSX from "xlsx";

const App = () => {
  const [text, setText] = useState("");
  const [tableData, setTableData] = useState([]);
  const [searchText, setSearchText] = useState("");

  const handleChangeInput = (e) => {
    const { value } = e.target;
    setText(value);
    localStorage.setItem("khachHangInfo", value);
  };

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearchText(value.toLowerCase());
  };

  const xoaTatCaKhoangTrang = (str) => {
    return str.replace(/\s+/g, "");
  };

  const coPhaiCongTy = (str) => {
    return /công\s+ty/i.test(str);
  };

  const tachDuLieu = (lines) => {
    const data = lines
      .split("\n")
      .map((line, index) => {
        line = line.trim();
        if (!line) return null;

        // Tìm số điện thoại
        const sdtMatch = line.match(/\b\d{3,4}\s?\d{6,7}\b/);
        if (!sdtMatch) {
          console.warn(`❌ Không tìm thấy SĐT ở dòng ${index + 1}: ${line}`);
          return null;
        }

        const sdt = sdtMatch[0].replace(/\s+/, " ").trim();
        const indexSdt = line.indexOf(sdtMatch[0]);
        const ten = line.slice(0, indexSdt).trim();

        const afterSdt = line
          .slice(indexSdt + sdtMatch[0].length)
          .replace(/^\s+/, "");

        const tcMatch = afterSdt.match(
          /(Đầu tư\s*)?(<|>)\s*\d+([\s-]*\d+)?\s*tỷ/i
        );
        const taiChinh = tcMatch ? tcMatch[0].trim() : "";

        let yeuCau = "";
        if (taiChinh) {
          const indexTc = afterSdt.indexOf(taiChinh);
          yeuCau = afterSdt
            .slice(indexTc + taiChinh.length)
            .replace(/^[,\s]+/, "");
        }

        const numberMatch = taiChinh.match(/(\d+)(\s*-\s*(\d+))?/i);
        const soTien = numberMatch ? parseInt(numberMatch[1]) : Infinity;

        return { ten, sdt, taiChinh, yeuCau, soTien };
      })
      .filter(Boolean);

    data.sort((a, b) => b.soTien - a.soTien);

    return data.map(({ soTien, ...rest }) => rest);
  };

  const getFilteredData = () => {
    if (!searchText) return tableData;

    return tableData.filter((item) => {
      const values = [item.ten, item.sdt, item.taiChinh, item.yeuCau];
      return values.some((val) => val?.toLowerCase().includes(searchText));
    });
  };

  const handleFileExcel = () => {
    if (!tableData || tableData.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    // 👉 1. Tạo dữ liệu có thêm cột STT
    const dataWithStt = tableData.map((item, index) => ({
      STT: index + 1,
      ...item,
    }));

    // 👉 2. Tạo worksheet từ dữ liệu có STT
    const worksheet = XLSX.utils.json_to_sheet(dataWithStt);

    // 👉 3. Auto cột rộng
    const colWidths = Object.keys(dataWithStt[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...dataWithStt.map((row) => (row[key] ? row[key].toString().length : 0))
      );
      return { wch: maxLen + 2 };
    });
    worksheet["!cols"] = colWidths;

    // 👉 4. Thêm border cho từng ô
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { r: R, c: C };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (!worksheet[cell_ref]) continue;

        worksheet[cell_ref].s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }

    // 👉 5. Xuất file
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách khách");

    const now = new Date();
    const fileName = `khach-hang-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  useEffect(() => {
    const data = tachDuLieu(text);
    if (data) {
      setTableData(data);
    }
  }, [text]);

  useEffect(() => {
    const localText = localStorage.getItem("khachHangInfo");
    if (localText) {
      setText(localText);
    }
  }, []);

  const filteredData = getFilteredData();

  return (
    <div id="container">
      <form>
        <textarea
          value={text}
          onChange={handleChangeInput}
          placeholder="Nhập danh sách khách hàng mỗi dòng..."
        ></textarea>
      </form>

      <div className="inputItem">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, số điện thoại, tài chính, yêu cầu..."
          onChange={handleSearch}
        />
      </div>

      {tableData.length > 0 && (
        <button type="button" onClick={handleFileExcel}>
          Xuất file
        </button>
      )}

      <div className="content">
        {filteredData.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên</th>
                <th>Số ĐT</th>
                <th>Tài Chính</th>
                <th>Yêu cầu</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                const soDienThoai = xoaTatCaKhoangTrang(item.sdt);
                const congTy = coPhaiCongTy(item.ten);

                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td
                      style={{
                        color:
                          item.ten === "" ? "red" : congTy ? "blue" : "black",
                      }}
                    >
                      {item.ten || "Chưa có tên"}
                    </td>
                    <td>
                      <a
                        href={`https://zalo.me/${soDienThoai}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {soDienThoai}
                      </a>
                    </td>
                    <td>{item.taiChinh}</td>
                    <td>{item.yeuCau}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>Không tìm thấy kết quả phù hợp.</p>
        )}
      </div>
    </div>
  );
};

export default App;
