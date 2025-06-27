import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const InputV2 = () => {
  const [text, setText] = useState("");
  const [tableData, setTableData] = useState([]);
  const [searchText, setSearchText] = useState("");

  const handleChangeInput = (e) => {
    const { value } = e.target;
    setText(value);
    localStorage.setItem("khachHangInfoV2", value);
  };

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearchText(value.toLowerCase());
  };

  const xoaTatCaKhoangTrang = (str) => str.replace(/\s+/g, "");

  const coPhaiCongTy = (str) => /công\s+ty/i.test(str);

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const tachDuLieu = (lines) => {
    const data = lines
      .split("\n")
      .map((line, index) => {
        line = line.trim();
        if (!line) return null;

        const sdtMatch = line.match(/\b\d{3,4}\s?\d{6,7}\b/);
        if (!sdtMatch) {
          console.warn(`❌ Không tìm thấy SĐT ở dòng ${index + 1}: ${line}`);
          return null;
        }

        const sdt = sdtMatch[0].replace(/\s+/, " ").trim();
        const indexSdt = line.indexOf(sdtMatch[0]);
        let ten = line.slice(0, indexSdt).trim();
        ten = toTitleCase(ten);

        const afterSdt = line
          .slice(indexSdt + sdtMatch[0].length)
          .replace(/^\s+/, "");

        const tcMatch = afterSdt.match(
          /(Đầu tư\s*)?(<|>)\s*\d+([\s-]*\d+)?\s*tỷ/i
        );
        const taiChinh = tcMatch ? tcMatch[0].trim() : "";

        let yeuCau = "";
        let tenDuong = "";
        let ghiChu = "";

        if (taiChinh) {
          const indexTc = afterSdt.indexOf(taiChinh);
          const afterTc = afterSdt
            .slice(indexTc + taiChinh.length)
            .replace(/^[,\s]+/, "");
          const parts = afterTc.split("|").map((s) => s.trim());

          yeuCau = parts[0] || "";
          tenDuong = parts.length > 1 ? toTitleCase(parts[1]) : "";
          ghiChu = parts.length > 2 ? parts.slice(2).join(" | ") : "";
        }

        const numberMatch = taiChinh.match(/(\d+)(\s*-\s*(\d+))?/i);
        const soTien = numberMatch ? parseInt(numberMatch[1]) : Infinity;

        return {
          ten,
          sdt,
          taiChinh,
          yeuCau,
          tenDuong,
          ghiChu,
          soTien,
        };
      })
      .filter(Boolean);

    data.sort((a, b) => b.soTien - a.soTien);

    return data.map(({ soTien, ...rest }) => rest);
  };

  const getFilteredData = () => {
    if (!searchText) return tableData;
    return tableData.filter((item) => {
      const values = [
        item.ten,
        item.sdt,
        item.taiChinh,
        item.yeuCau,
        item.tenDuong,
        item.ghiChu,
      ];
      return values.some((val) => val?.toLowerCase().includes(searchText));
    });
  };

  const handleFileExcel = () => {
    if (!tableData || tableData.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataWithStt = tableData.map((item, index) => ({
      STT: index + 1,
      ...item,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataWithStt);

    const colWidths = Object.keys(dataWithStt[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...dataWithStt.map((row) => (row[key] ? row[key].toString().length : 0))
      );
      return { wch: maxLen + 2 };
    });
    worksheet["!cols"] = colWidths;

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
    const localText = localStorage.getItem("khachHangInfoV2");
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
          placeholder="Tên Số ĐT Tài Chính | Yêu Cầu | Tên Đường | Ghi Chú"
        ></textarea>
      </form>

      <div className="inputItem">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, số điện thoại, tài chính, yêu cầu, tên đường, ghi chú..."
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
                <th>Yêu Cầu</th>
                <th>Tên Đường</th>
                <th>Ghi Chú</th>
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
                    <td>{item.tenDuong}</td>
                    <td>{item.ghiChu}</td>
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

export default InputV2;
