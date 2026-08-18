pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
    }

    options {
        timeout(time: 1, unit: 'HOURS')
        timestamps()
        disableConcurrentBuilds(abortPrevious: true)
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Node.js') {
            steps {
                script {
                    def nodeHome = tool name: 'NodeJS 18', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                script {
                    def browsers = ['chrome', 'firefox']

                    for (browser in browsers) {
                        stage("Run ${browser}") {
                            sh """
                                npx cypress run \\
                                  --browser ${browser} \\
                                  --reporter mochawesome \\
                                  --reporter-options reportDir=reports/mochawesome/${browser},overwrite=false,html=false,json=true
                            """
                        }
                    }
                }
            }
        }

        stage('Merge Reports') {
            steps {
                sh 'npm run report:merge'
            }
        }

        stage('Generate HTML Report') {
            steps {
                sh 'npm run report:generate:html'
            }
        }

        stage('Publish Report') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports/html',
                    reportFiles: 'test-report.html',
                    reportName: 'Cypress Test Report'
                ])
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: 'reports/**/*,cypress/screenshots/**/*,cypress/videos/**/*', fingerprint: true
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            emailext (
                subject: "Cypress Tests Failed - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        success {
            emailext (
                subject: "Cypress Tests Passed - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Build succeeded. Check report at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
