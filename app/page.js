export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(to bottom right, #2563eb, #7c3aed)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          fontWeight: 'bold'
        }}>
          🦷 Dental Practice Management System
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          marginBottom: '2rem',
          opacity: 0.9
        }}>
          AI-Powered Practice Management Software
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
            <div style={{ fontWeight: 'bold' }}>Appointments</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Smart scheduling</div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            <div style={{ fontWeight: 'bold' }}>Patients</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Complete records</div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
            <div style={{ fontWeight: 'bold' }}>AI Assistant</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>24/7 chatbot</div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
            <div style={{ fontWeight: 'bold' }}>Billing</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Automated invoices</div>
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🚀 Status: In Development</h2>
          <p style={{ opacity: 0.9, marginBottom: '0.5rem' }}>
            Full application launching soon with:
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <li>✅ Database architecture complete</li>
            <li>✅ Business model & documentation ready</li>
            <li>✅ License system operational</li>
            <li>🚧 Frontend UI in development</li>
            <li>🚧 Backend API in development</li>
          </ul>
        </div>

        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
          <p>Self-hosted • Secure • Customizable</p>
          <p style={{ marginTop: '0.5rem' }}>
            Deployed on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
        opacity: 0.6,
        fontSize: '0.9rem'
      }}>
        <p>Powered by Next.js • PostgreSQL • AI</p>
      </div>
    </main>
  )
}
