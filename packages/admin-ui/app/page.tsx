import { prisma } from "db";
import { revalidatePath } from "next/cache";

async function addPerson(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const food = formData.get("food") as string;

  if (name) {
    await prisma.person.create({
      data: {
        name,
        favoriteFoods: {
          create: food ? { name: food } : undefined,
        },
      },
    });
    revalidatePath("/");
  }
}

export default async function Home() {
  const people = await prisma.person.findMany({
    include: {
      favoriteFoods: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <main className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">TemplateMCP Admin</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add Person & Favorite Food</h2>
          <form action={addPerson} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input 
                name="name" 
                type="text" 
                required 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Favorite Food</label>
              <input 
                name="food" 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                placeholder="Pizza"
              />
            </div>
            <button 
              type="submit" 
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Registered People</h2>
          <div className="space-y-4">
            {people.length === 0 ? (
              <p className="text-gray-500 italic">No one registered yet.</p>
            ) : (
              people.map((person) => (
                <div key={person.id} className="border-b pb-2">
                  <span className="font-bold text-gray-800">{person.name}</span>
                  <ul className="ml-4 list-disc text-sm text-gray-600">
                    {person.favoriteFoods.map((food) => (
                      <li key={food.id}>{food.name}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
