import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
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

  useEffect(() => {
    const data = paginatedTransactions?.data ?? transactionsByEmployee ?? null

    if (data && data.length > 0) {
      setTransactions(currentTransactions => [...currentTransactions, ...data])
    }
  }, [paginatedTransactions, transactionsByEmployee])


  // const transactions = useMemo(
  //   () => {
  //     console.log('paginatedTransactions', paginatedTransactions)
  //     const data = paginatedTransactions?.data ?? transactionsByEmployee ?? null
  //     const paginatedData = paginatedTransactions?.data ?? []
  //     const employeeData = transactionsByEmployee ?? []
  //     // return currentEmployeeId === null ? [...paginatedData] : [...employeeData]
  //   }, [paginatedTransactions, transactionsByEmployee]
  // )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
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
          <Transactions transactions={transactions} />

          {transactions !== null && (
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
