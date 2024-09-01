import { Fragment, useCallback, useEffect, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [modifiedTransactions, setModifiedTransactions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const data = paginatedTransactions?.data ?? transactionsByEmployee ?? null

    if (data && data.length > 0) {
      const mergedTransactions = data.map(transaction => {
        if (modifiedTransactions[transaction.id] !== undefined) {
          return { ...transaction, approved: modifiedTransactions[transaction.id] };
        }
        return transaction;
      });
      setTransactions(currentTransactions => [...currentTransactions, ...mergedTransactions]);
    }
  }, [paginatedTransactions, transactionsByEmployee])

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()
    
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])
  
  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            setCurrentEmployeeId(newValue === EMPTY_EMPLOYEE ? null : newValue!.id)
            setTransactions([])
            if (newValue === null) {
              return
            }

            if (newValue === EMPTY_EMPLOYEE) {
              await loadAllTransactions()
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions 
            transactions={transactions} 
            setModifiedTransactions={setModifiedTransactions}
          />

          {transactions !== null && paginatedTransactions !== null && paginatedTransactions?.nextPage !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                if (currentEmployeeId === null) {
                  await loadAllTransactions()
                  return
                }
                await loadTransactionsByEmployee(currentEmployeeId)
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
