import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
}

export default function DataTable<T>({
  title,
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  return (
    <div className="card data-table-card">
      {title && (
        <div className="card-header">
          <h5 className="mb-0">{title}</h5>
        </div>
      )}
      <div className="card-body p-0">
        <div className="table-responsive" style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-5">
                    <div className="text-muted">{emptyMessage}</div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={keyExtractor(item)}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.render
                          ? column.render(item)
                          : (item as any)[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
