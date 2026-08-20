def runDevice(String device) {
    def grepFlag = params.GREP_TAGS?.trim()
        ? "--env grepTags=${params.GREP_TAGS.trim()},grepOmitFiltered=true"
        : ''

    sh """
        DEVICE=${device} npx cypress run \\
          --browser ${params.BROWSER} \\
          --spec '${params.SPEC}' \\
          ${grepFlag}
    """

    sh """
        rm -rf allure-results-${device} cypress/screenshots-${device}
        mv allure-results allure-results-${device} 2>/dev/null || true
        [ -d cypress/screenshots ] && mv cypress/screenshots cypress/screenshots-${device} || true
    """
}

pipeline {
    // Same image the project's own Dockerfile uses (Node 18, Chrome 118,
    // Firefox 118 preinstalled) so any branch, on any Jenkins node with
    // Docker, gets a consistent, already-verified browser set. Electron is
    // always available too since it ships bundled with Cypress itself.
    agent {
        docker {
            image 'cypress/browsers:node18.18.0-chrome118-ff118'
            args '--ipc=host'
        }
    }

    parameters {
        string(
            name: 'SPEC',
            defaultValue: 'cypress/e2e/**/*.cy.js',
            description: 'Spec path or glob to run, e.g. cypress/e2e/ui/Homepage/SearchRightTruck.cy.js'
        )
        choice(
            name: 'BROWSER',
            choices: ['chrome', 'firefox', 'electron'],
            description: 'Browser to run the chosen spec(s) in'
        )
        choice(
            name: 'DEVICE',
            choices: ['desktop', 'mobile', 'both'],
            description: 'Device emulation to test and view a report for'
        )
        string(
            name: 'GREP_TAGS',
            defaultValue: '',
            description: 'Optional @cypress/grep tag filter, e.g. @smoke (blank = run everything the SPEC matches)'
        )
    }

    environment {
        NODE_ENV = 'test'
        CI = 'true'
    }

    options {
        timeout(time: 1, unit: 'HOURS')
        timestamps()
        disableConcurrentBuilds(abortPrevious: true)
        buildDiscarder(logRotator(numToKeepStr: '30'))
    }

    stages {
        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Cypress - Desktop') {
            when {
                expression { params.DEVICE == 'desktop' || params.DEVICE == 'both' }
            }
            steps {
                script { runDevice('desktop') }
            }
        }

        stage('Cypress - Mobile') {
            when {
                expression { params.DEVICE == 'mobile' || params.DEVICE == 'both' }
            }
            steps {
                script { runDevice('mobile') }
            }
        }

        stage('Generate reports') {
            steps {
                script {
                    if (params.DEVICE == 'desktop' || params.DEVICE == 'both') {
                        sh "npx allure generate allure-results-desktop --clean -o allure-report-desktop --config config/allure/allure.yml"
                    }
                    if (params.DEVICE == 'mobile' || params.DEVICE == 'both') {
                        sh "npx allure generate allure-results-mobile --clean -o allure-report-mobile --config config/allure/allure.yml"
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                if (params.DEVICE == 'desktop' || params.DEVICE == 'both') {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'allure-report-desktop',
                        reportFiles: 'index.html',
                        reportName: 'Allure Report - Desktop'
                    ])
                }
                if (params.DEVICE == 'mobile' || params.DEVICE == 'both') {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'allure-report-mobile',
                        reportFiles: 'index.html',
                        reportName: 'Allure Report - Mobile'
                    ])
                }
            }
            archiveArtifacts(
                artifacts: 'allure-results-*/**, allure-report-*/**, cypress/screenshots-*/**',
                allowEmptyArchive: true,
                fingerprint: true
            )
            cleanWs()
        }
        failure {
            emailext(
                subject: "Cypress Tests Failed - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Build failed (browser=${params.BROWSER}, device=${params.DEVICE}, spec=${params.SPEC}). Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        success {
            emailext(
                subject: "Cypress Tests Passed - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Build succeeded (browser=${params.BROWSER}, device=${params.DEVICE}, spec=${params.SPEC}). Report at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
