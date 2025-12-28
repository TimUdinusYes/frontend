import Link from "next/link";

export default function Home() {
  const features = [
    {
      path: "/AdaptiveMaterial",
      title: "Adaptive Material",
      description: "Adaptive Material Learning System"
    },
    {
      path: "/games",
      title: "Games",
      description: "Educational Games Platform"
    },
    {
      path: "/Multi-Source-Knowledge",
      title: "Multi-Source Knowledge",
      description: "Multi-Source Knowledge Base"
    },
    {
      path: "/n8n-workflow",
      title: "N8N Workflow",
      description: "Workflow Automation System"
    },
    {
      path: "/PeerConnect",
      title: "Peer Connect",
      description: "Peer-to-Peer Connection Platform"
    },
    {
      path: "/TaskIntegrator",
      title: "Task Integrator",
      description: "Task Integration & Management"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to Lomba Web</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {features.map((feature) => (
          <Link
            key={feature.path}
            href={feature.path}
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
          >
            <h2 className="text-2xl font-semibold">{feature.title}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
