import { rm } from "fs/promises"
import { join } from "path"
import { fileURLToPath } from "url"

const clean = async () => {
  const __dirname = fileURLToPath(new URL(".", import.meta.url))
  const dirToDelete = join(__dirname, "../dist")

  try {
    await rm(dirToDelete, { recursive: true, force: true })
    console.log('The "dist" folder was cleaned successfully.')
  } catch (err) {
    console.error(`Error cleaning "dist" folder: ${err.message}`)
    process.exit(1)
  }
}

clean()
