import { useEffect, useState } from "react";

interface AdjacencyMatrixInputProps {
  size: number;
  matrix: number[][];
  onChange: (matrix: number[][]) => void;
  disabled?: boolean;
}

const AdjacencyMatrixInput = ({
  size,
  matrix,
  onChange,
  disabled = false,
}: AdjacencyMatrixInputProps) => {
  const [localMatrix, setLocalMatrix] = useState<string[][]>([]);

  useEffect(() => {
    const stringMatrix = matrix.map((row) =>
      row.map((val) => (val === 0 ? "0" : val.toString()))
    );
    setLocalMatrix(stringMatrix);
  }, [matrix]);

  const handleCellChange = (row: number, col: number, value: string) => {
    // Only allow numbers
    if (value !== "" && !/^\d+$/.test(value)) return;

    const newMatrix = localMatrix.map((r) => [...r]);
    newMatrix[row][col] = value;
    // Mirror for undirected graph
    newMatrix[col][row] = value;
    setLocalMatrix(newMatrix);

    // Convert to numbers and update parent
    const numMatrix = newMatrix.map((r) =>
      r.map((v) => (v === "" ? 0 : parseInt(v, 10)))
    );
    onChange(numMatrix);
  };

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-10 h-10 text-xs text-muted-foreground font-mono"></th>
            {Array.from({ length: size }, (_, i) => (
              <th
                key={i}
                className="w-12 h-10 text-xs text-primary font-mono font-bold"
              >
                {i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {localMatrix.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="w-10 h-10 text-xs text-primary font-mono font-bold text-center">
                {rowIndex}
              </td>
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="p-0">
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) =>
                      handleCellChange(rowIndex, colIndex, e.target.value)
                    }
                    disabled={disabled || rowIndex === colIndex}
                    className={`matrix-cell ${
                      rowIndex === colIndex
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : ""
                    } ${
                      parseInt(cell) > 0 && rowIndex !== colIndex
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    maxLength={2}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-3">
        Enter edge weights (0 = no edge). Matrix is symmetric for undirected graphs.
      </p>
    </div>
  );
};

export default AdjacencyMatrixInput;
