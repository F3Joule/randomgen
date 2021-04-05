const XorShift128Plus = require('xorshift.js').XorShift128Plus
const { readFileSync, writeFileSync } = require('fs')
const { GenericAccountId } = require('@polkadot/types')
const registry = require('@subsocial/types/substrate/registry')

const isValidAddress = (address) => {
  try {
    new GenericAccountId(registry, address)
    return true
  } catch {
    return false
  }
}

const parseDate = (datetime) => {
  const [date, time] = datetime.split(' ')
  const [day, month, year] = date.split('/')
  const [hour, minute, second] = time.split(':')

  return new Date(`${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute}:${second}`)
}

const getResults = () => {
  const resultsString = readFileSync(`${__dirname}/results.csv`, { encoding: 'utf-8' })
  const resultLines = resultsString.split('\r\n')

  let results = []
  resultLines.map((result, index) => {
    const splitResult = result.split(',').splice(0, 6)

    const date = parseDate(splitResult[0])
    const points = parseInt(splitResult[2].split('/').shift().trim())
    const accountId = splitResult[5].split('/').pop()

    results.push({
      date,
      email: splitResult[1],
      points,
      telegram: splitResult[3],
      twitter: splitResult[4],
      accountId,
    })
  })
  results.shift()

  return results
}

const main = () => {
  if (process.argv.length < 3) {
    throw 'No block hash provided'
  }
  const blockHash = process.argv[2]
  const prng = new XorShift128Plus(blockHash)
  console.log('BlockHash', blockHash)

  const possibleWinners = getResults()
    .filter((record) => record.date <= new Date('2021-04-04T05:00:00'))
    .filter((record) => record.points >= 65)
    .filter((record) => isValidAddress(record.accountId))

  let generatedNumbers = []
  let numbersModulo = []
  let randomWinners = []
  for (let i = 0; i < 50; i++) {
    const generatedNumber = prng.randomInt64()[0]
    const numberModule = generatedNumber % possibleWinners.length
    generatedNumbers.push(generatedNumber)
    numbersModulo.push(numberModule)
    randomWinners.push(possibleWinners[numberModule])
  }

  console.log('Total filtered list length:', possibleWinners.length)
  console.log('Generated numbers:', generatedNumbers)
  console.log('Numbers modulo list length:', numbersModulo)

  const writeToFilePath = `${__dirname}/winners.json`

  writeFileSync(
    writeToFilePath,
    JSON.stringify(
      {
        blockHash: blockHash,
        randomNumbers: generatedNumbers,
        randomWinners,
      },
      null,
      2
    )
  )
  console.log(`Winners list is written to file '${writeToFilePath}'`)
}

main()
